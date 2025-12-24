<template>
  <div class="payment-config">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ T('PaymentConfig') }}</span>
          <el-button type="primary" size="small" @click="loadConfigFull">{{ T('ShowFullConfig') }}</el-button>
        </div>
      </template>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="140px" v-loading="loading">
        <el-form-item :label="T('EnablePayment')" prop="enable">
          <el-switch v-model="formData.enable" />
        </el-form-item>
        <el-form-item :label="T('BaseURL')" prop="base_url">
          <el-input v-model="formData.base_url" placeholder="https://credit.linux.do/epay" />
        </el-form-item>
        <el-form-item :label="T('MerchantID')" prop="pid">
          <el-input v-model="formData.pid" :placeholder="T('MerchantIDPlaceholder')" />
        </el-form-item>
        <el-form-item :label="T('MerchantKey')" prop="key">
          <el-input v-model="formData.key" type="password" show-password :placeholder="T('MerchantKeyPlaceholder')" />
        </el-form-item>
        <el-form-item :label="T('NotifyURL')" prop="notify_url">
          <el-input v-model="formData.notify_url" :placeholder="T('NotifyURLPlaceholder')" />
          <div class="form-tip">{{ T('NotifyURLTip') }}</div>
        </el-form-item>
        <el-form-item :label="T('ReturnURL')" prop="return_url">
          <el-input v-model="formData.return_url" :placeholder="T('ReturnURLPlaceholder')" />
          <div class="form-tip">{{ T('ReturnURLTip') }}</div>
        </el-form-item>
        <el-form-item :label="T('Timeout')" prop="timeout">
          <el-input-number v-model="formData.timeout" :min="5" :max="60" />
          <span style="margin-left: 8px;">{{ T('Seconds') }}</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">{{ T('Save') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getConfig, getConfigFull, saveConfig } from '@/api/admin/payment_config'
import { T } from '@/utils/i18n'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const formData = reactive({
  enable: false,
  base_url: 'https://credit.linux.do/epay',
  pid: '',
  key: '',
  notify_url: '',
  return_url: '',
  timeout: 15,
})

const rules = {
  base_url: [{ required: true, message: T('ParamRequired', { param: T('BaseURL') }), trigger: 'blur' }],
}

const loadConfig = async () => {
  loading.value = true
  const res = await getConfig().catch(() => false)
  loading.value = false
  if (res && res.data) {
    Object.assign(formData, res.data)
  }
}

const loadConfigFull = async () => {
  loading.value = true
  const res = await getConfigFull().catch(() => false)
  loading.value = false
  if (res && res.data) {
    Object.assign(formData, res.data)
    ElMessage.success(T('OperationSuccess'))
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  const res = await saveConfig(formData).catch(() => false)
  submitting.value = false
  if (res) {
    ElMessage.success(T('OperationSuccess'))
  }
}

onMounted(loadConfig)
</script>

<style scoped lang="scss">
.payment-config {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
