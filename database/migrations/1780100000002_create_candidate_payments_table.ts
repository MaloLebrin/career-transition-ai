import { BaseSchema } from '@adonisjs/lucid/schema'
import {
  BILLING_CURRENCY,
  paymentProductValues,
  paymentProviderValues,
  paymentStatusValues,
} from '../../shared/constants/billing.js'

/**
 * #94 — paiements du forfait particuliers (épic B2C #90).
 *
 * `employee_id` et `user_id` sont en SET NULL : après une purge RGPD
 * (`candidate:purge`), l'enregistrement comptable subsiste anonymisé pendant
 * dix ans (art. L123-22 du Code de commerce, `RETENTION_PERIODS`).
 * Aucune colonne `key|token|secret|hash` : les identifiants Stripe sont des
 * références, pas des secrets (garde `secret_model_columns`).
 */
export default class extends BaseSchema {
  protected tableName = 'candidate_payments'

  async up() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('employee_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('employees')
        .onDelete('SET NULL')
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table
        .integer('organization_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('organizations')
        .onDelete('RESTRICT')

      table.string('product_code', 40).notNullable()
      table.string('provider', 20).notNullable()
      table.string('status', 20).notNullable()
      table.integer('amount_cents').notNullable()
      table.string('currency', 3).notNullable().defaultTo(BILLING_CURRENCY)

      table.string('stripe_checkout_session_id', 255).nullable().unique()
      table.string('stripe_payment_intent_id', 255).nullable()

      table.timestamp('paid_at', { useTz: true }).nullable()
      table.timestamp('refunded_at', { useTz: true }).nullable()
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table.string('revoke_reason', 500).nullable()
      table
        .integer('granted_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('withdrawal_waived_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['employee_id', 'status'])
      table.index(['stripe_payment_intent_id'])
    })

    if (isPostgres) {
      const quote = (values: readonly string[]) => values.map((v) => `'${v}'`).join(',')
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_product_code_check"
        CHECK (product_code IN (${quote(paymentProductValues)}))
      `)
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_provider_check"
        CHECK (provider IN (${quote(paymentProviderValues)}))
      `)
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_status_check"
        CHECK (status IN (${quote(paymentStatusValues)}))
      `)
    }
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'

    if (isPostgres) {
      for (const name of ['product_code', 'provider', 'status']) {
        this.schema.raw(
          `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_${name}_check"`
        )
      }
    }

    this.schema.dropTable(this.tableName)
  }
}
