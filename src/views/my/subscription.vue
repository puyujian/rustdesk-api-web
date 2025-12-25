<template>
  <div class="subscription-container">
    <el-card class="status-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ T('MySubscription') }}</span>
          <el-button type="primary" size="small" @click="toOrders">{{ T('MyOrders') }}</el-button>
        </div>
      </template>
      <div v-if="status.plan_name" class="status-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="T('CurrentPlan')">
            <el-tag type="success">{{ status.plan_name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="T('Status')">
            <el-tag :type="status.is_active ? 'success' : 'danger'">
              {{ status.is_active ? T('Active') : T('Inactive') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="T('ExpireAt')">
            {{ status.expire_at || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <el-empty v-else :description="T('NoSubscription')">
        <el-button type="primary" @click="scrollToPlans">{{ T('SubscribeNow') }}</el-button>
      </el-empty>
    </el-card>

    <el-card class="plans-card" shadow="hover" id="plans-section">
      <template #header>
        <span>{{ T('SubscriptionPlan') }}</span>
      </template>
      <el-alert
        v-if="!paymentEnabled"
        type="warning"
        :title="T('PaymentDisabled')"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <div class="plans-grid" v-loading="loading">
        <el-empty v-if="!loading && plans.length === 0" :description="paymentEnabled ? T('NoData') : T('PaymentDisabled')" />
        <el-card
          v-for="plan in plans"
          :key="plan.id"
          class="plan-item"
          :class="{ 'current-plan': status.plan_id === plan.id }"
          shadow="hover"
        >
          <div class="plan-header">
            <h3>{{ plan.name }}</h3>
            <div class="plan-price">
              <span v-if="plan.price > 0" class="price">¥{{ formatPrice(plan.price) }}</span>
              <span v-else class="price free">{{ T('Free') }}</span>
              <span class="duration">/ {{ formatDuration(plan) }}</span>
            </div>
          </div>
          <div class="plan-description" v-if="plan.description">
            {{ plan.description }}
          </div>
          <div class="plan-action">
            <el-button
              v-if="status.plan_id === plan.id"
              type="success"
              @click="handleSubscribe(plan)"
              :loading="subscribing === plan.id"
            >
              {{ T('RenewNow') }}
            </el-button>
            <el-button
              v-else
              type="primary"
              @click="handleSubscribe(plan)"
              :loading="subscribing === plan.id"
            >
              {{ status.plan_name ? T('ChangePlan') : T('Subscribe') }}
            </el-button>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPlans, getStatus, createOrder } from '@/api/subscription'
import { redirectToPay } from '@/utils/payment'
import { T } from '@/utils/i18n'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const subscribing = ref(null)
const plans = ref([])
const paymentEnabled = ref(true)
const status = reactive({
  plan_id: null,
  plan_name: '',
  is_active: false,
  expire_at: '',
})

const unwrapResponseData = (res) => {
  if (!res) return null

  // request 拦截器默认返回后端统一结构：{ code, message, data }
  if (typeof res === 'object' && !Array.isArray(res) && 'code' in res && 'data' in res) {
    return res.data
  }

  // 兼容未开启拦截器时的 axios 原始 response：{ data: { code, message, data } }
  if (
    typeof res === 'object' &&
    !Array.isArray(res) &&
    'data' in res &&
    res.data &&
    typeof res.data === 'object' &&
    'code' in res.data &&
    'data' in res.data
  ) {
    return res.data.data
  }

  // 兜底：直接返回
  return res
}

const formatPrice = (priceFen) => {
  if (!priceFen) return '0.00'
  return (priceFen / 100).toFixed(2)
}

const formatDuration = (plan) => {
  const count = plan.period_count || 1
  const unit = plan.period_unit || 'month'
  const unitMap = {
    day: T('Days', { param: '' }, count),
    month: T('Months', { param: '' }, count),
    year: T('Years', { param: '' }, count),
  }
  return `${count} ${String(unitMap[unit] || unit || '').trim()}`
}

const formatTimestamp = (ts) => {
  if (!ts) return '-'
  const date = new Date(ts * 1000)
  return date.toLocaleString()
}

const loadPlans = async () => {
  loading.value = true
  try {
    const res = await getPlans()
    const payload = unwrapResponseData(res)
    if (!payload) {
      plans.value = []
    } else if (Array.isArray(payload)) {
      plans.value = payload
    } else {
      const listData = payload.list ?? payload.plans ?? []
      plans.value = Array.isArray(listData) ? listData : []
    }
  } catch (e) {
    // 支付功能未启用时不显示错误提示，只记录状态
    if (e && e.code === 101) {
      paymentEnabled.value = false
    }
  } finally {
    loading.value = false
  }
}

const loadStatus = async () => {
  try {
    const res = await getStatus()
    const payload = unwrapResponseData(res)
    if (!payload) return

    paymentEnabled.value = payload.payment_enabled !== false
    const sub = payload.subscription || {}
    status.plan_id = sub.plan_id || null
    status.plan_name = sub.plan?.name || ''
    status.is_active = payload.active || false
    status.expire_at = sub.expire_at ? formatTimestamp(sub.expire_at) : ''
  } catch (e) {
    // 忽略错误
  }
}

const handleSubscribe = async (plan) => {
  if (!paymentEnabled.value) {
    ElMessage.warning(T('PaymentDisabled'))
    return
  }
  subscribing.value = plan.id
  try {
    const res = await createOrder({ plan_id: plan.id })
    const payload = unwrapResponseData(res)
    if (!payload) return

    const payURL = payload.pay_url || payload.payURL || ''
    const outTradeNo = payload.out_trade_no || payload.outTradeNo || ''

    if (payURL) {
      redirectToPay(payURL)
      return
    }

    if (outTradeNo) {
      ElMessage.success(T('OperationSuccess'))
      loadStatus()
    }
  } catch (e) {
    // 错误已由 request 拦截器处理
  } finally {
    subscribing.value = null
  }
}

const toOrders = () => {
  router.push('/my/orders')
}

const scrollToPlans = () => {
  document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  loadPlans()
  loadStatus()
})
</script>

<style scoped lang="scss">
.subscription-container {
  padding: 20px;
}

.status-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-info {
    padding: 10px 0;
  }
}

.plans-card {
  .plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .plan-item {
    transition: transform 0.3s, box-shadow 0.3s;

    &:hover {
      transform: translateY(-5px);
    }

    &.current-plan {
      border: 2px solid var(--el-color-success);
    }

    .plan-header {
      text-align: center;
      padding-bottom: 15px;
      border-bottom: 1px solid var(--el-border-color-light);

      h3 {
        margin: 0 0 10px 0;
        font-size: 18px;
      }

      .plan-price {
        .price {
          font-size: 28px;
          font-weight: bold;
          color: var(--el-color-primary);

          &.free {
            color: var(--el-color-success);
          }
        }

        .duration {
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .plan-description {
      padding: 15px 0;
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }

    .plan-features {
      padding: 10px 0;

      .feature-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 0;
        color: var(--el-text-color-regular);

        .el-icon {
          color: var(--el-color-success);
        }
      }
    }

    .plan-action {
      padding-top: 15px;
      text-align: center;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
