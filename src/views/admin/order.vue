<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="80px">
        <el-form-item :label="T('OrderNo')">
          <el-input v-model="listQuery.out_trade_no" clearable />
        </el-form-item>
        <el-form-item :label="T('UserId')">
          <el-input v-model="listQuery.user_id" clearable type="number" />
        </el-form-item>
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
        <el-table-column prop="id" label="ID" align="center" width="80" />
        <el-table-column prop="out_trade_no" :label="T('OrderNo')" align="center" min-width="200" />
        <el-table-column :label="T('Username')" align="center">
          <template #default="{ row }">
            {{ row.user?.username || '-' }}
          </template>
        </el-table-column>
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
        <el-table-column :label="T('Actions')" align="center" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleDetail(row)">
              {{ T('Detail') }}
            </el-button>
            <el-button
              v-if="row.status === 0"
              type="warning"
              size="small"
              link
              @click="handleClose(row)"
            >
              {{ T('Close') }}
            </el-button>
            <el-button
              v-if="row.status === 1"
              type="danger"
              size="small"
              link
              @click="handleRefund(row)"
            >
              {{ T('Refund') }}
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

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" width="600" :title="T('OrderDetail')">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item :label="T('OrderNo')">{{ detailData.out_trade_no }}</el-descriptions-item>
        <el-descriptions-item :label="T('Username')">{{ detailData.user?.username || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="T('PlanName')">{{ detailData.plan?.name || detailData.subject || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="T('Amount')">¥{{ formatPrice(detailData.amount) }}</el-descriptions-item>
        <el-descriptions-item :label="T('OrderStatus')">
          <el-tag :type="statusType(detailData.status)">{{ statusText(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="T('TradeNo')">{{ detailData.trade_no || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="T('PaymentTime')">{{ formatTimestamp(detailData.paid_at) }}</el-descriptions-item>
        <el-descriptions-item :label="T('RefundTime')">{{ formatTimestamp(detailData.refunded_at) }}</el-descriptions-item>
        <el-descriptions-item :label="T('CreatedAt')">{{ detailData.created_at }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">{{ T('Close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onActivated, watch } from 'vue'
import { list, detail, refund, close } from '@/api/admin/order'
import { T } from '@/utils/i18n'
import { ElMessage, ElMessageBox } from 'element-plus'

const listRes = reactive({
  list: [],
  total: 0,
  loading: false,
})

const listQuery = reactive({
  page: 1,
  page_size: 10,
  out_trade_no: '',
  user_id: '',
  status: null,
})

const detailVisible = ref(false)
const detailData = ref(null)

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
  if (!params.out_trade_no) delete params.out_trade_no
  if (!params.user_id) delete params.user_id
  if (params.status === null || params.status === undefined) {
    delete params.status
  }
  const res = await list(params).catch(() => false)
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

const handleDetail = async (row) => {
  const res = await detail(row.id).catch(() => false)
  if (res && res.data) {
    detailData.value = res.data
    detailVisible.value = true
  }
}

const handleClose = async (row) => {
  const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('CloseOrder') }), {
    confirmButtonText: T('Confirm'),
    cancelButtonText: T('Cancel'),
    type: 'warning',
  }).catch(() => false)
  if (!cf) return
  const res = await close({ id: row.id }).catch(() => false)
  if (res) {
    ElMessage.success(T('OperationSuccess'))
    getList()
  }
}

const handleRefund = async (row) => {
  const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Refund') }), {
    confirmButtonText: T('Confirm'),
    cancelButtonText: T('Cancel'),
    type: 'warning',
  }).catch(() => false)
  if (!cf) return
  const res = await refund({ order_id: row.id, reason: 'Admin refund' }).catch(() => false)
  if (res) {
    ElMessage.success(T('OperationSuccess'))
    getList()
  }
}

onMounted(getList)
onActivated(getList)

watch(() => listQuery.page, getList)
watch(() => listQuery.page_size, handlerQuery)
</script>

<style scoped lang="scss">
</style>
