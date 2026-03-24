using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalFinance.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddV2Features : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_users_UserId",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_transactions_account_id",
                table: "transactions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AuditLogs",
                table: "AuditLogs");

            migrationBuilder.RenameTable(
                name: "AuditLogs",
                newName: "audit_logs");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "audit_logs",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "audit_logs",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "MetadataJson",
                table: "audit_logs",
                newName: "metadata_json");

            migrationBuilder.RenameColumn(
                name: "EntityType",
                table: "audit_logs",
                newName: "entity_type");

            migrationBuilder.RenameColumn(
                name: "EntityId",
                table: "audit_logs",
                newName: "entity_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "audit_logs",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "ActionType",
                table: "audit_logs",
                newName: "action_type");

            migrationBuilder.RenameIndex(
                name: "IX_AuditLogs_UserId",
                table: "audit_logs",
                newName: "IX_audit_logs_user_id");

            migrationBuilder.AddColumn<bool>(
                name: "review_required",
                table: "transactions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string[]>(
                name: "tags",
                table: "transactions",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            migrationBuilder.AlterColumn<string>(
                name: "entity_type",
                table: "audit_logs",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "action_type",
                table: "audit_logs",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<Guid>(
                name: "account_id",
                table: "audit_logs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_audit_logs",
                table: "audit_logs",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "account_invitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    token = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    invited_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_account_invitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_account_invitations_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_account_invitations_users_invited_by_user_id",
                        column: x => x.invited_by_user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "account_members",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    invite_status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    invited_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_account_members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_account_members_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_account_members_users_invited_by_user_id",
                        column: x => x.invited_by_user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_account_members_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    condition_json = table.Column<string>(type: "jsonb", nullable: false),
                    action_json = table.Column<string>(type: "jsonb", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_rules_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_transactions_account_id_transaction_date",
                table: "transactions",
                columns: new[] { "account_id", "transaction_date" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_account_id_created_at",
                table: "audit_logs",
                columns: new[] { "account_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_account_invitations_account_id_email_status",
                table: "account_invitations",
                columns: new[] { "account_id", "email", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_account_invitations_invited_by_user_id",
                table: "account_invitations",
                column: "invited_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_account_invitations_token",
                table: "account_invitations",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_account_members_account_id_user_id",
                table: "account_members",
                columns: new[] { "account_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_account_members_invited_by_user_id",
                table: "account_members",
                column: "invited_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_account_members_user_id_invite_status",
                table: "account_members",
                columns: new[] { "user_id", "invite_status" });

            migrationBuilder.CreateIndex(
                name: "IX_rules_user_id_is_active_priority",
                table: "rules",
                columns: new[] { "user_id", "is_active", "priority" });

            migrationBuilder.AddForeignKey(
                name: "FK_audit_logs_accounts_account_id",
                table: "audit_logs",
                column: "account_id",
                principalTable: "accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_audit_logs_users_user_id",
                table: "audit_logs",
                column: "user_id",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_audit_logs_accounts_account_id",
                table: "audit_logs");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_logs_users_user_id",
                table: "audit_logs");

            migrationBuilder.DropTable(
                name: "account_invitations");

            migrationBuilder.DropTable(
                name: "account_members");

            migrationBuilder.DropTable(
                name: "rules");

            migrationBuilder.DropIndex(
                name: "IX_transactions_account_id_transaction_date",
                table: "transactions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_audit_logs",
                table: "audit_logs");

            migrationBuilder.DropIndex(
                name: "IX_audit_logs_account_id_created_at",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "review_required",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "tags",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "account_id",
                table: "audit_logs");

            migrationBuilder.RenameTable(
                name: "audit_logs",
                newName: "AuditLogs");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "AuditLogs",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "AuditLogs",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "metadata_json",
                table: "AuditLogs",
                newName: "MetadataJson");

            migrationBuilder.RenameColumn(
                name: "entity_type",
                table: "AuditLogs",
                newName: "EntityType");

            migrationBuilder.RenameColumn(
                name: "entity_id",
                table: "AuditLogs",
                newName: "EntityId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "AuditLogs",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "action_type",
                table: "AuditLogs",
                newName: "ActionType");

            migrationBuilder.RenameIndex(
                name: "IX_audit_logs_user_id",
                table: "AuditLogs",
                newName: "IX_AuditLogs_UserId");

            migrationBuilder.AlterColumn<string>(
                name: "EntityType",
                table: "AuditLogs",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80);

            migrationBuilder.AlterColumn<string>(
                name: "ActionType",
                table: "AuditLogs",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80);

            migrationBuilder.AddPrimaryKey(
                name: "PK_AuditLogs",
                table: "AuditLogs",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_transactions_account_id",
                table: "transactions",
                column: "account_id");

            migrationBuilder.AddForeignKey(
                name: "FK_AuditLogs_users_UserId",
                table: "AuditLogs",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
