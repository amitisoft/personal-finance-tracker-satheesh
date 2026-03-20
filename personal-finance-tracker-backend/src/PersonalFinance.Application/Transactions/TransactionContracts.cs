namespace PersonalFinance.Application.Transactions;

public sealed record TransactionListItemDto(
    Guid Id,
    Guid AccountId,
    Guid? CategoryId,
    Guid? RecurringTransactionId,
    Guid? TransferGroupId,
    string Type,
    decimal Amount,
    DateOnly Date,
    string? Merchant,
    string? Note,
    string? PaymentMethod);

public sealed record UpsertTransactionRequest(
    Guid? Id,
    Guid AccountId,
    Guid? CategoryId,
    Guid? DestinationAccountId,
    string Type,
    decimal Amount,
    DateOnly Date,
    string? Merchant,
    string? Note,
    string? PaymentMethod);

public sealed record TransactionFilters(
    DateOnly? DateFrom,
    DateOnly? DateTo,
    Guid? CategoryId,
    Guid? AccountId,
    string? Type,
    string? Search,
    int Page = 1,
    int PageSize = 20,
    string? SortBy = null,
    string? SortDirection = null);
