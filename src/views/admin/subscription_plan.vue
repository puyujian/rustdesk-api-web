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
        <el-table-column prop="name" :label="T('PlanName')" align="center" />
        <el-table-column prop="price" :label="T('Price')" align="center">
          <template #default="{ row }">
            <span>¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration" :label="T('DurationDays')" align="center" />
        <el-table-column prop="description" :label="T('Description')" align="center" show-overflow-tooltip />
        <el-table-column prop="sort" :label="T('Sort')" align="center" width="80" />
        <el-table-column prop="status" :label="T('Status')" align="center" width="100">
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

    <el-dialog v-model="formVisible" width="600" :title="!formData.id ? T('Create') : T('Update')">
      <el-form ref="form" :model="formData" label-width="120px" :rules="rules">
        <el-form-item :label="T('PlanName')" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item :label="T('Price')" prop="price">
          <el-input-number v-model="formData.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item :label="T('DurationDays')" prop="duration">
          <el-input-number v-model="formData.duration" :min="1" />
        </el-form-item>
        <el-form-item :label="T('Description')" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="T('Features')" prop="features">
          <el-input v-model="formData.features" type="textarea" :rows="4" placeholder="每行一个功能特性" />
        </el-form-item>
        <el-form-item :label="T('Sort')" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>
        <el-form-item :label="T('Status')" prop="status">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
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
  name: '',
  price: 0,
  duration: 30,
  description: '',
  features: '',
  sort: 0,
  status: 1,
})

const rules = {
  name: [{ required: true, message: T('ParamRequired', { param: T('PlanName') }), trigger: 'blur' }],
  duration: [{ required: true, message: T('ParamRequired', { param: T('DurationDays') }), trigger: 'blur' }],
}

const toAdd = () => {
  formVisible.value = true
  formData.id = 0
  formData.name = ''
  formData.price = 0
  formData.duration = 30
  formData.description = ''
  formData.features = ''
  formData.sort = 0
  formData.status = 1
}

const toEdit = (row) => {
  formVisible.value = true
  formData.id = row.id
  formData.name = row.name
  formData.price = row.price
  formData.duration = row.duration
  formData.description = row.description
  formData.features = row.features
  formData.sort = row.sort
  formData.status = row.status
}

const submit = async () => {
  const v = await form.value.validate().catch(() => false)
  if (!v) return
  const api = formData.id ? update : create
  const res = await api(formData).catch(() => false)
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
