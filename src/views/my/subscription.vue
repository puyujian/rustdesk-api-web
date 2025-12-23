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
      <div class="plans-grid" v-loading="loading">
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
              <span v-if="plan.price > 0" class="price">¥{{ plan.price }}</span>
              <span v-else class="price free">{{ T('Free') }}</span>
              <span class="duration">/ {{ plan.duration }} {{ T('Days') }}</span>
            </div>
          </div>
          <div class="plan-description" v-if="plan.description">
            {{ plan.description }}
          </div>
          <div class="plan-features" v-if="plan.features">
            <div v-for="(feature, idx) in parseFeatures(plan.features)" :key="idx" class="feature-item">
              <el-icon><ElIconCheck /></el-icon>
              <span>{{ feature }}</span>
            </div>
          </div>
          <div class="plan-action">
            <el-button
              v-if="status.plan_id === plan.id"
              type="success"
              disabled
            >
              {{ T('CurrentPlan') }}
            </el-button>
            <el-button
              v-else
              type="primary"
              @click="handleSubscribe(plan)"
              :loading="subscribing === plan.id"
            >
              {{ status.plan_name ? T('RenewNow') : T('Subscribe') }}
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
import { T } from '@/utils/i18n'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const subscribing = ref(null)
const plans = ref([])
const status = reactive({
  plan_id: null,
  plan_name: '',
  is_active: false,
  expire_at: '',
})

const loadPlans = async () => {
  loading.value = true
  const res = await getPlans().catch(() => false)
  loading.value = false
  if (res && res.data) {
    plans.value = res.data.list || res.data || []
  }
}

const loadStatus = async () => {
  const res = await getStatus().catch(() => false)
  if (res && res.data) {
    Object.assign(status, res.data)
  }
}

const parseFeatures = (features) => {
  if (!features) return []
  if (Array.isArray(features)) return features
  try {
    return JSON.parse(features)
  } catch {
    return features.split('\n').filter(f => f.trim())
  }
}

const handleSubscribe = async (plan) => {
  subscribing.value = plan.id
  const res = await createOrder({ plan_id: plan.id }).catch(() => false)
  subscribing.value = null
  if (res && res.data) {
    if (res.data.pay_url) {
      window.location.href = res.data.pay_url
    } else if (res.data.order_no) {
      ElMessage.success(T('OperationSuccess'))
      loadStatus()
    }
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
