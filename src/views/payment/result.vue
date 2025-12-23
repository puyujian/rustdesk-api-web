<template>
  <div class="payment-result-container">
    <el-card class="result-card" shadow="hover">
      <div class="result-content">
        <div v-if="status === 'success'" class="result-icon success">
          <el-icon :size="80"><ElIconCircleCheck /></el-icon>
        </div>
        <div v-else-if="status === 'failed'" class="result-icon failed">
          <el-icon :size="80"><ElIconCircleClose /></el-icon>
        </div>
        <div v-else class="result-icon processing">
          <el-icon :size="80" class="is-loading"><ElIconLoading /></el-icon>
        </div>

        <h2 class="result-title">
          {{ status === 'success' ? T('PaymentSuccess') : status === 'failed' ? T('PaymentFailed') : T('PaymentProcessing') }}
        </h2>

        <p class="result-message" v-if="message">{{ message }}</p>

        <div class="result-info" v-if="orderNo">
          <el-descriptions :column="1" border>
            <el-descriptions-item :label="T('OrderNo')">{{ orderNo }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="result-actions">
          <el-button type="primary" @click="toHome">{{ T('BackToHome') }}</el-button>
          <el-button @click="toOrders">{{ T('ViewOrders') }}</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { T } from '@/utils/i18n'

const route = useRoute()
const router = useRouter()

const status = ref('processing')
const message = ref('')
const orderNo = ref('')

onMounted(() => {
  const query = route.query
  if (query.trade_status === 'TRADE_SUCCESS' || query.status === 'success') {
    status.value = 'success'
  } else if (query.trade_status === 'TRADE_CLOSED' || query.status === 'failed') {
    status.value = 'failed'
  } else {
    status.value = query.status || 'processing'
  }
  orderNo.value = query.out_trade_no || query.order_no || ''
  message.value = query.msg || ''
})

const toHome = () => {
  router.push('/')
}

const toOrders = () => {
  router.push('/my/orders')
}
</script>

<style scoped lang="scss">
.payment-result-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
  padding: 20px;
}

.result-card {
  width: 100%;
  max-width: 500px;
}

.result-content {
  text-align: center;
  padding: 40px 20px;
}

.result-icon {
  margin-bottom: 20px;

  &.success {
    color: var(--el-color-success);
  }

  &.failed {
    color: var(--el-color-danger);
  }

  &.processing {
    color: var(--el-color-primary);
  }
}

.result-title {
  font-size: 24px;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}

.result-message {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.result-info {
  margin: 20px 0;
  text-align: left;
}

.result-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 15px;
}
</style>
