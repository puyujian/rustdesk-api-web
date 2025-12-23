<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="80px">
        <el-form-item :label="T('OrderNo')">
          <el-input v-model="listQuery.order_no" clearable />
        </el-form-item>
        <el-form-item :label="T('Username')">
          <el-input v-model="listQuery.username" clearable />
        </el-form-item>
        <el-form-item :label="T('OrderStatus')">
          <el-select v-model="listQuery.status" clearable>
            <el-option :label="T('Pending')" value="pending" />
            <el-option :label="T('Paid')" value="paid" />
            <el-option :label="T('Cancelled')" value="cancelled" />
            <el-option :label="T('Refunded')" value="refunded" />
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
        <el-table-column prop="order_no" :label="T('OrderNo')" align="center" min-width="180" />
        <el-table-column prop="username" :label="T('Username')" align="center" />
        <el-table-column prop="plan_name" :label="T('PlanName')" align="center" />
        <el-table-column prop="amount" :label="T('Amount')" align="center">
          <template #default="{ row }">
            <span>¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="T('OrderStatus')" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_method" :label="T('PaymentMethod')" align="center" />
        <el-table-column prop="paid_at" :label="T('PaymentTime')" align="center" min-width="160" />
        <el-table-column prop="created_at" :label="T('CreatedAt')" align="center" min-width="160" />
        <el-table-column :label="T('Actions')" align="center" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'paid'"
              type="danger"
              size="small"
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
  </div>
</template>

<script setup>
import { reactive, onMounted, onActivated, watch } from 'vue'
import { list, refund } from '@/api/admin/order'
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
  order_no: '',
  username: '',
  status: null,
})

const getList = async () => {
  listRes.loading = true
  const res = await list(listQuery).catch(() => false)
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
    pending: 'warning',
    paid: 'success',
    cancelled: 'info',
    refunded: 'danger',
  }
  return map[status] || 'info'
}

const statusText = (status) => {
  const map = {
    pending: T('Pending'),
    paid: T('Paid'),
    cancelled: T('Cancelled'),
    refunded: T('Refunded'),
  }
  return map[status] || status
}

const handleRefund = async (row) => {
  const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Refund') }), {
    confirmButtonText: T('Confirm'),
    cancelButtonText: T('Cancel'),
    type: 'warning',
  }).catch(() => false)
  if (!cf) return
  const res = await refund({ id: row.id }).catch(() => false)
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
