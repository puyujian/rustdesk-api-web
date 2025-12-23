<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="80px">
        <el-form-item :label="T('Username')">
          <el-input v-model="listQuery.username" clearable />
        </el-form-item>
        <el-form-item :label="T('Status')">
          <el-select v-model="listQuery.status" clearable>
            <el-option :label="T('Active')" :value="1" />
            <el-option :label="T('Inactive')" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
          <el-button type="success" @click="toGrant">{{ T('Grant') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="list-body" shadow="hover">
      <el-table :data="listRes.list" v-loading="listRes.loading" border>
        <el-table-column prop="id" label="ID" align="center" width="80" />
        <el-table-column prop="username" :label="T('Username')" align="center" />
        <el-table-column prop="plan_name" :label="T('PlanName')" align="center" />
        <el-table-column prop="status" :label="T('Status')" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? T('Active') : T('Inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_at" :label="T('CreatedAt')" align="center" min-width="160" />
        <el-table-column prop="expire_at" :label="T('ExpireAt')" align="center" min-width="160" />
        <el-table-column :label="T('Actions')" align="center" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >
              {{ T('Cancel') }}
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

    <el-dialog v-model="grantVisible" width="500" :title="T('GrantSubscription')">
      <el-form ref="grantForm" :model="grantData" label-width="120px" :rules="grantRules">
        <el-form-item :label="T('SelectUser')" prop="user_id">
          <el-select v-model="grantData.user_id" filterable>
            <el-option
              v-for="user in allUsers"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="T('SelectPlan')" prop="plan_id">
          <el-select v-model="grantData.plan_id">
            <el-option
              v-for="plan in planList"
              :key="plan.id"
              :label="plan.name"
              :value="plan.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="T('DurationDays')" prop="duration">
          <el-input-number v-model="grantData.duration" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="grantVisible = false">{{ T('Cancel') }}</el-button>
        <el-button type="primary" @click="submitGrant">{{ T('Submit') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onActivated, watch } from 'vue'
import { list, grant, cancel } from '@/api/admin/subscription'
import { list as listPlans } from '@/api/admin/subscription_plan'
import { list as listUsers } from '@/api/user'
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
  username: '',
  status: null,
})

const allUsers = ref([])
const planList = ref([])

const getList = async () => {
  listRes.loading = true
  const res = await list(listQuery).catch(() => false)
  listRes.loading = false
  if (res && res.data) {
    listRes.list = res.data.list || []
    listRes.total = res.data.total || 0
  }
}

const loadUsers = async () => {
  const res = await listUsers({ page_size: 9999 }).catch(() => false)
  if (res && res.data) {
    allUsers.value = res.data.list || []
  }
}

const loadPlans = async () => {
  const res = await listPlans({ page_size: 9999 }).catch(() => false)
  if (res && res.data) {
    planList.value = res.data.list || []
  }
}

const handlerQuery = () => {
  listQuery.page = 1
  getList()
}

const grantVisible = ref(false)
const grantForm = ref(null)
const grantData = reactive({
  user_id: null,
  plan_id: null,
  duration: 30,
})

const grantRules = {
  user_id: [{ required: true, message: T('ParamRequired', { param: T('SelectUser') }), trigger: 'change' }],
  plan_id: [{ required: true, message: T('ParamRequired', { param: T('SelectPlan') }), trigger: 'change' }],
  duration: [{ required: true, message: T('ParamRequired', { param: T('DurationDays') }), trigger: 'blur' }],
}

const toGrant = () => {
  grantVisible.value = true
  grantData.user_id = null
  grantData.plan_id = null
  grantData.duration = 30
}

const submitGrant = async () => {
  const v = await grantForm.value.validate().catch(() => false)
  if (!v) return
  const res = await grant(grantData).catch(() => false)
  if (res) {
    ElMessage.success(T('OperationSuccess'))
    grantVisible.value = false
    getList()
  }
}

const handleCancel = async (row) => {
  const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('CancelSubscription') }), {
    confirmButtonText: T('Confirm'),
    cancelButtonText: T('Cancel'),
    type: 'warning',
  }).catch(() => false)
  if (!cf) return
  const res = await cancel({ id: row.id }).catch(() => false)
  if (res) {
    ElMessage.success(T('OperationSuccess'))
    getList()
  }
}

onMounted(() => {
  getList()
  loadUsers()
  loadPlans()
})
onActivated(getList)

watch(() => listQuery.page, getList)
watch(() => listQuery.page_size, handlerQuery)
</script>

<style scoped lang="scss">
</style>
