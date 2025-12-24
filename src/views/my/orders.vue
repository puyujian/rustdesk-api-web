<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="80px">
        <el-form-item :label="T('OrderStatus')">
          <el-select v-model="listQuery.status" clearable>
            <el-option :label="T('Pending')" :value="0" />
            <el-option :label="T('Paid')" :value="1" />
            <el-option :label="T('Refunded')" :value="2" />
            <el-option :label="T('Closed')" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="list-body" shadow="hover">
      <el-table :data="listRes.list" v-loading="listRes.loading" border>
        <el-table-column prop="out_trade_no" :label="T('OrderNo')" align="center" min-width="200" />
        <el-table-column :label="T('PlanName')" align="center">
          <template #default="{ row }">
            {{ row.plan?.name || row.subject || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="T('Amount')" align="center">
          <template #default="{ row }">
            <span>¥{{ formatPrice(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('OrderStatus')" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="T('PaymentTime')" align="center" min-width="160">
          <template #default="{ row }">
            {{ formatTimestamp(row.paid_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="T('CreatedAt')" align="center" min-width="160">
          <template #default="{ row }">
            {{ row.created_at }}
          </template>
        </el-table-column>
        <el-table-column :label="T('Actions')" align="center" width="120">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              @click="toPay(row)"
            >
              {{ T('PayNow') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card class="list-page" shadow="hover">
      <el-pagination
        background
        layout="prev, pager, next, sizes, jumper"
        :page-sizes="[10, 20, 50, 100]"
        v-model:page-size="listQuery.page_size"
        v-model:current-page="listQuery.page"
        :total="listRes.total"
      />
    </el-card>
  </div>
</template>

<script setup>
import { reactive, onMounted, onActivated, watch } from 'vue'
import { getOrders, createOrder } from '@/api/subscription'
import { T } from '@/utils/i18n'
import { ElMessage } from 'element-plus'

const listRes = reactive({
  list: [],
  total: 0,
  loading: false,
})

const listQuery = reactive({
  page: 1,
  page_size: 10,
  status: null,
})

const formatPrice = (priceFen) => {
  if (!priceFen && priceFen !== 0) return '0.00'
  return (priceFen / 100).toFixed(2)
}

const formatTimestamp = (ts) => {
  if (!ts) return '-'
  const date = new Date(ts * 1000)
  return date.toLocaleString()
}

const getList = async () => {
  listRes.loading = true
  const params = { ...listQuery }
  if (params.status === null || params.status === undefined) {
    delete params.status
  }
  const res = await getOrders(params).catch(() => false)
  listRes.loading = false
  if (res && res.data) {
    listRes.list = res.data.list || []
    listRes.total = res.data.total || 0
  }
}

const handlerQuery = () => {
  listQuery.page = 1
  getList()
}

const statusType = (status) => {
  const map = {
    0: 'warning',
    1: 'success',
    2: 'danger',
    3: 'info',
  }
  return map[status] ?? 'info'
}

const statusText = (status) => {
  const map = {
    0: T('Pending'),
    1: T('Paid'),
    2: T('Refunded'),
    3: T('Closed'),
  }
  return map[status] ?? String(status)
}

const toPay = async (row) => {
  if (row.pay_url) {
    window.location.href = row.pay_url
    return
  }
  const res = await createOrder({ plan_id: row.plan_id }).catch(() => false)
  if (res && res.data && res.data.pay_url) {
    window.location.href = res.data.pay_url
  } else {
    ElMessage.error(T('OperationFailed'))
  }
}

onMounted(getList)
onActivated(getList)

watch(() => listQuery.page, getList)
watch(() => listQuery.page_size, handlerQuery)
</script>

<style scoped lang="scss">
</style>
