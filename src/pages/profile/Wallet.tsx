import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import './Wallet.css'

interface PaymentOrder {
  id: string
  product_code: string
  amount_cents: number
  currency: string
  quantity: number
  status: 'pending' | 'paid' | 'cancelled' | 'failed' | 'expired'
  created_at: string
  paid_at?: string | null
}

const WalletPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('sent')
  const [isPendingOpen, setIsPendingOpen] = useState(false)
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWalletData = async () => {
      if (!user) return

      setError(null)
      try {
        const ordersResult = await supabase
          .from('payment_orders' as never)
          .select('id, product_code, amount_cents, currency, quantity, status, created_at, paid_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (ordersResult.error) throw ordersResult.error

        setOrders((ordersResult.data || []) as unknown as PaymentOrder[])
      } catch (loadError) {
        console.error('Error loading wallet data:', loadError)
        setError('Impossible de charger les paiements.')
      }
    }

    loadWalletData()
  }, [user])

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === 'pending'),
    [orders]
  )

  const paidOrders = useMemo(
    () => orders.filter((order) => order.status === 'paid'),
    [orders]
  )

  const totalPaidCents = useMemo(
    () => paidOrders.reduce((sum, order) => sum + order.amount_cents, 0),
    [paidOrders]
  )

  const totalPendingCents = useMemo(
    () => pendingOrders.reduce((sum, order) => sum + order.amount_cents, 0),
    [pendingOrders]
  )

  const formatAmount = (amountCents: number, currency = 'eur') =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase() }).format(amountCents / 100)

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="wallet-page">
      <div className="wallet-balance-card">
        <span className="wallet-balance-label">Achats confirmés</span>
        <span className="wallet-balance-amount">{formatAmount(totalPaidCents)}</span>
        <div className="wallet-balance-meta">
          <span className="wallet-balance-sub-label">En attente de confirmation</span>
          <span className="wallet-balance-sub-amount">{formatAmount(totalPendingCents)}</span>
        </div>
      </div>

      <div className="wallet-pending">
        <button
          className={`wallet-pending-toggle ${isPendingOpen ? 'open' : ''}`}
          type="button"
          onClick={() => setIsPendingOpen((prev) => !prev)}
        >
          <span>En attente de confirmation</span>
          <span className="wallet-pending-amount">{formatAmount(totalPendingCents)}</span>
        </button>
        {isPendingOpen && (
          <div className="wallet-pending-list">
            {pendingOrders.length === 0 ? (
              <div className="wallet-pending-item">
                <div className="wallet-pending-info">
                  <span className="wallet-pending-title">Aucune transaction en attente</span>
                  <span className="wallet-pending-subtitle">Les paiements Stripe apparaîtront ici.</span>
                </div>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div className="wallet-pending-item" key={order.id}>
                  <div className="wallet-pending-info">
                    <span className="wallet-pending-title">{order.product_code}</span>
                    <span className="wallet-pending-subtitle">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="wallet-pending-actions">
                    <span className="wallet-action-chip">{formatAmount(order.amount_cents, order.currency)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="wallet-activity">
        <div className="wallet-tabs">
          <button
            className={`wallet-tab ${activeTab === 'received' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('received')}
          >
            Validés
          </button>
          <button
            className={`wallet-tab ${activeTab === 'sent' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('sent')}
          >
            Historique
          </button>
        </div>
        <div className="wallet-list">
          {error && <div className="wallet-error">{error}</div>}
          {(activeTab === 'received' ? paidOrders : orders).length === 0 ? (
            <p className="wallet-muted">
              {activeTab === 'received' ? 'Aucun paiement validé.' : 'Aucun paiement pour le moment.'}
            </p>
          ) : (
            <div className="wallet-orders-list">
              {(activeTab === 'received' ? paidOrders : orders).map((order) => (
                <div className="wallet-order-item" key={order.id}>
                  <div className="wallet-order-main">
                    <span className="wallet-order-code">{order.product_code}</span>
                    <span className={`wallet-order-status status-${order.status}`}>{order.status}</span>
                  </div>
                  <div className="wallet-order-meta">
                    <span>{formatAmount(order.amount_cents, order.currency)}</span>
                    <span>{formatDate(order.paid_at || order.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletPage
