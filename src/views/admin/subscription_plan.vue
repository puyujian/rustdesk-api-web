<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="80px">
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
          <el-button type="danger" @click="toAdd">{{ T('Add') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="list-body" shadow="hover">
      <el-table :data="listRes.list" v-loading="listRes.loading" border>
        <el-table-column prop="id" label="ID" align="center" width="80" />
        <el-table-column prop="code" :label="T('PlanCode')" align="center" />
        <el-table-column prop="name" :label="T('PlanName')" align="center" />
        <el-table-column :label="T('Price')" align="center">
          <template #default="{ row }">
            <span>¥{{ formatPrice(row.price) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('Duration')" align="center">
          <template #default="{ row }">
            {{ row.period_count }} {{ periodUnitText(row.period_unit) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="T('Description')" align="center" show-overflow-tooltip />
        <el-table-column prop="sort_order" :label="T('Sort')" align="center" width="80" />
        <el-table-column :label="T('Status')" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? T('Enabled') : T('Disabled') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="T('CreatedAt')" align="center" min-width="160" />
        <el-table-column :label="T('Actions')" align="center" width="160">
          <template #default="{ row }">
            <el-button size="small" @click="toEdit(row)">{{ T('Edit') }}</el-button>
            <el-button type="danger" size="small" @click="del(row)">{{ T('Delete') }}</el-button>
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

    <el-dialog v-model="formVisible" width="600px" :title="!formData.id ? T('Create') : T('Update')">
      <el-form ref="form" :model="formData" label-width="120px" :rules="rules">
        <el-form-item :label="T('PlanCode')" prop="code">
          <el-input v-model="formData.code" placeholder="e.g. monthly, yearly" />
        </el-form-item>
        <el-form-item :label="T('PlanName')" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item :label="T('Price')" prop="price">
          <el-input-number v-model="formData.price" :min="0" :precision="2" :step="0.01" />
          <span style="margin-left: 8px; color: #999;">{{ T('Yuan') }}</span>
        </el-form-item>
        <el-form-item :label="T('Duration')" prop="period_count">
          <el-input-number v-model="formData.period_count" :min="1" style="width: 120px;" />
          <el-select v-model="formData.period_unit" style="width: 100px; margin-left: 8px;">
            <el-option :label="T('Days')" value="day" />
            <el-option :label="T('Months')" value="month" />
            <el-option :label="T('Years')" value="year" />
          </el-select>
        </el-form-item>
        <el-form-item :label="T('Description')" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="T('Sort')" prop="sort_order">
          <el-input-number v-model="formData.sort_order" :min="0" />
        </el-form-item>
        <el-form-item :label="T('Status')" prop="status">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">{{ T('Cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ T('Submit') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onActivated, watch } from 'vue'
import { list, create, update, remove } from '@/api/admin/subscription_plan'
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
})

const formatPrice = (priceFen) => {
  if (!priceFen && priceFen !== 0) return '0.00'
  return (priceFen / 100).toFixed(2)
}

const periodUnitText = (unit) => {
  const map = {
    day: T('Days'),
    month: T('Months'),
    year: T('Years'),
  }
  return map[unit] || unit
}

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

const formVisible = ref(false)
const form = ref(null)
const formData = reactive({
  id: 0,
  code: '',
  name: '',
  price: 0,
  period_unit: 'month',
  period_count: 1,
  description: '',
  sort_order: 0,
  status: 1,
})

const rules = {
  code: [{ required: true, message: T('ParamRequired', { param: T('PlanCode') }), trigger: 'blur' }],
  name: [{ required: true, message: T('ParamRequired', { param: T('PlanName') }), trigger: 'blur' }],
  period_count: [{ required: true, message: T('ParamRequired', { param: T('Duration') }), trigger: 'blur' }],
}

const toAdd = () => {
  formVisible.value = true
  formData.id = 0
  formData.code = ''
  formData.name = ''
  formData.price = 0
  formData.period_unit = 'month'
  formData.period_count = 1
  formData.description = ''
  formData.sort_order = 0
  formData.status = 1
}

const toEdit = (row) => {
  formVisible.value = true
  formData.id = row.id
  formData.code = row.code
  formData.name = row.name
  formData.price = row.price / 100
  formData.period_unit = row.period_unit || 'month'
  formData.period_count = row.period_count || 1
  formData.description = row.description
  formData.sort_order = row.sort_order
  formData.status = row.status
}

const submit = async () => {
  const v = await form.value.validate().catch(() => false)
  if (!v) return

  const submitData = {
    ...formData,
    price: Math.round(formData.price * 100),
  }

  const api = formData.id ? update : create
  const res = await api(submitData).catch(() => false)
  if (res) {
    ElMessage.success(T('OperationSuccess'))
    formVisible.value = false
    getList()
  }
}

const del = async (row) => {
  const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Delete') }), {
    confirmButtonText: T('Confirm'),
    cancelButtonText: T('Cancel'),
    type: 'warning',
  }).catch(() => false)
  if (!cf) return
  const res = await remove({ id: row.id }).catch(() => false)
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
