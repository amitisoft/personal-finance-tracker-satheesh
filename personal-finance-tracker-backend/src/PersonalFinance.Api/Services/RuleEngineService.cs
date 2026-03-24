using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PersonalFinance.Api.Contracts;
using PersonalFinance.Api.Helpers;
using PersonalFinance.Domain.Entities;
using PersonalFinance.Domain.Enums;
using PersonalFinance.Infrastructure.Persistence;

namespace PersonalFinance.Api.Services;

public sealed class RuleEngineService
{
    private static readonly HashSet<string> SupportedFields = ["merchant", "amount", "category", "note", "paymentMethod", "transactionType", "tags", "account"];
    private static readonly HashSet<string> SupportedOperators = ["equals", "not_equals", "contains", "starts_with", "greater_than", "greater_than_or_equal", "less_than", "less_than_or_equal", "in"];
    private static readonly HashSet<string> SupportedActions = ["set_category", "add_tag", "trigger_alert", "mark_review"];
    private readonly AppDbContext _db;

    public RuleEngineService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Rule>> GetRulesAsync(Guid userId, CancellationToken cancellationToken)
        => await _db.RulesSet.Where(x => x.UserId == userId).OrderByDescending(x => x.Priority).ThenBy(x => x.Name).ToListAsync(cancellationToken);

    public void Validate(RuleConditionVm condition, RuleActionVm action)
    {
        if (!SupportedFields.Contains(condition.Field))
        {
            throw new InvalidOperationException("Unsupported rule field.");
        }

        if (!SupportedOperators.Contains(condition.Operator))
        {
            throw new InvalidOperationException("Unsupported rule operator.");
        }

        if (!SupportedActions.Contains(action.Type))
        {
            throw new InvalidOperationException("Unsupported rule action.");
        }

        if ((condition.Operator is "greater_than" or "greater_than_or_equal" or "less_than" or "less_than_or_equal") && condition.Field != "amount")
        {
            throw new InvalidOperationException("Numeric comparison operators are only supported for amount.");
        }

        if (action.Type == "set_category" && string.IsNullOrWhiteSpace(action.Value))
        {
            throw new InvalidOperationException("A category id is required for set_category actions.");
        }
    }

    public async Task<Transaction> ApplyAsync(Guid userId, Transaction transaction, CancellationToken cancellationToken)
    {
        var rules = await _db.RulesSet
            .Where(x => x.UserId == userId && x.IsActive)
            .OrderByDescending(x => x.Priority)
            .ThenBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        foreach (var rule in rules)
        {
            var condition = JsonSerializer.Deserialize<RuleConditionVm>(rule.ConditionJson);
            var action = JsonSerializer.Deserialize<RuleActionVm>(rule.ActionJson);
            if (condition is null || action is null || !Matches(condition, transaction))
            {
                continue;
            }

            await ApplyActionAsync(userId, action, transaction, cancellationToken);
        }

        transaction.Tags = transaction.Tags.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        return transaction;
    }

    public async Task<RuleTestResultVm> TestAsync(Guid userId, RuleTestRequest request, CancellationToken cancellationToken)
    {
        Validate(request.Condition, request.Action);
        var preview = new Transaction
        {
            UserId = userId,
            AccountId = request.Transaction.AccountId,
            DestinationAccountId = request.Transaction.DestinationAccountId,
            Type = request.Transaction.Type.ToTransactionType(),
            Amount = request.Transaction.Amount,
            TransactionDate = request.Transaction.Date,
            CategoryId = request.Transaction.CategoryId,
            Note = request.Transaction.Note,
            Merchant = request.Transaction.Merchant,
            PaymentMethod = request.Transaction.PaymentMethod,
            ReviewRequired = request.Transaction.ReviewRequired,
            Tags = request.Transaction.Tags?.ToArray() ?? [],
        };

        var matched = Matches(request.Condition, preview);
        if (matched)
        {
            await ApplyActionAsync(userId, request.Action, preview, cancellationToken);
        }

        return new RuleTestResultVm(matched, BuildSummary(request.Condition, request.Action), preview.ToVm());
    }

    public string BuildSummary(RuleConditionVm condition, RuleActionVm action)
        => $"When {condition.Field} {condition.Operator.Replace('_', ' ')} {condition.Value ?? string.Join(", ", condition.Values ?? [])}, {action.Type.Replace('_', ' ')} {action.Value}".Trim();

    private bool Matches(RuleConditionVm condition, Transaction transaction)
    {
        var fieldValue = condition.Field switch
        {
            "merchant" => transaction.Merchant,
            "note" => transaction.Note,
            "paymentMethod" => transaction.PaymentMethod,
            "category" => transaction.CategoryId?.ToString(),
            "transactionType" => transaction.Type.ToFrontend(),
            "account" => transaction.AccountId.ToString(),
            "tags" => string.Join(",", transaction.Tags),
            "amount" => transaction.Amount.ToString(System.Globalization.CultureInfo.InvariantCulture),
            _ => null,
        };

        return condition.Operator switch
        {
            "equals" => string.Equals(fieldValue, condition.Value, StringComparison.OrdinalIgnoreCase),
            "not_equals" => !string.Equals(fieldValue, condition.Value, StringComparison.OrdinalIgnoreCase),
            "contains" => fieldValue?.Contains(condition.Value ?? string.Empty, StringComparison.OrdinalIgnoreCase) == true,
            "starts_with" => fieldValue?.StartsWith(condition.Value ?? string.Empty, StringComparison.OrdinalIgnoreCase) == true,
            "greater_than" => CompareDecimal(fieldValue, condition.Value) > 0,
            "greater_than_or_equal" => CompareDecimal(fieldValue, condition.Value) >= 0,
            "less_than" => CompareDecimal(fieldValue, condition.Value) < 0,
            "less_than_or_equal" => CompareDecimal(fieldValue, condition.Value) <= 0,
            "in" => (condition.Values ?? []).Any(value => string.Equals(value, fieldValue, StringComparison.OrdinalIgnoreCase)),
            _ => false,
        };
    }

    private async Task ApplyActionAsync(Guid userId, RuleActionVm action, Transaction transaction, CancellationToken cancellationToken)
    {
        switch (action.Type)
        {
            case "set_category":
                var categoryId = Guid.Parse(action.Value!);
                var validCategory = await _db.CategoriesSet.AnyAsync(x => x.Id == categoryId && x.UserId == userId, cancellationToken);
                if (validCategory)
                {
                    transaction.CategoryId = categoryId;
                }
                break;
            case "add_tag":
                if (!string.IsNullOrWhiteSpace(action.Value))
                {
                    transaction.Tags = transaction.Tags.Append(action.Value.Trim()).ToArray();
                }
                break;
            case "trigger_alert":
                transaction.ReviewRequired = true;
                if (!string.IsNullOrWhiteSpace(action.Value) && !(transaction.Note ?? string.Empty).Contains(action.Value, StringComparison.OrdinalIgnoreCase))
                {
                    transaction.Note = string.IsNullOrWhiteSpace(transaction.Note) ? action.Value : $"{transaction.Note} | {action.Value}";
                }
                break;
            case "mark_review":
                transaction.ReviewRequired = true;
                break;
        }
    }

    private static int CompareDecimal(string? actual, string? expected)
    {
        _ = decimal.TryParse(actual, out var left);
        _ = decimal.TryParse(expected, out var right);
        return left.CompareTo(right);
    }
}
