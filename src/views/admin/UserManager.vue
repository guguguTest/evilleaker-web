<script setup>
import {onMounted, reactive, ref, toRaw} from 'vue';
import {avatarUrl} from '@/api/base';
import {joinUrl, filterObject} from '@/utils/misc.js';
import {getUserList, updateUser} from '@/api/admin/user';
import {ElMessage} from 'element-plus';
import {getServerList} from "@/api/admin/ccb.js";

const data = ref({
  users: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50
  }
});
const query = reactive({
  search: '',
  user_rank: '',
  banState: '',
  account_auth: ''
});
const loading = ref(false);
const editFormVisible = ref(false);
const editForm = ref({});
const editFormRef = ref();
const editFormRules = {
  avatar: [
    {min: 0, max: 255, message: '长度在255个字符内', trigger: 'submit'},
  ],
  username: [
    {required: true, message: '请输入用户名', trigger: 'submit'},
    {min: 0, max: 255, message: '长度在255个字符内', trigger: 'submit'},
  ],
  nickname: [
    {required: true, message: '请输入昵称', trigger: 'submit'},
    {min: 0, max: 255, message: '长度在255个字符内', trigger: 'submit'},
  ],
  email: [
    {required: true, message: '请输入邮箱地址', trigger: 'submit'},
    {type: 'email', message: '请输入正确的邮箱地址', trigger: 'submit'},
  ],
  user_rank: [
    {required: true, message: '请选择用户组', trigger: 'submit'},
  ],
  rankSp: [
    {required: true, message: '请选择特殊等级', trigger: 'submit'},
  ],
  account_auth: [
    {required: true, message: '请选择账户认证', trigger: 'submit'},
  ],
  points: [
    {required: true, message: '请输入积分', trigger: 'submit'},
    {pattern: /^(0|[1-9]\d*)$/, message: '只能输入正整数', trigger: 'submit'}
  ],
  point2: [
    {required: true, message: '请输入鸽屋积分', trigger: 'submit'},
    {pattern: /^(0|[1-9]\d*)$/, message: '只能输入正整数', trigger: 'submit'}
  ],
  keychip: [
    {min: 0, max: 255, message: '长度在255个字符内', trigger: 'submit'},
  ],
  game_server: [
    {min: 0, max: 255, message: '长度在255个字符内', trigger: 'submit'},
  ],
  guid: [
    {min: 0, max: 255, message: '长度在255个字符内', trigger: 'submit'},
  ],
  banState: [
    {required: true, message: '请选择状态', trigger: 'submit'},
  ],
};

let ccbServer = [];

const handleEdit = (row) => {
  editForm.value = Object.assign({}, row);
  editFormVisible.value = true;
};

// TODO 没写删除
const handleDelete = (row) => {

};

const handleEditCancel = () => {
  if (!editFormRef.value) return;
  // 清理验证组件
  editFormRef.value.resetFields();
  editForm.value = {};
  editFormVisible.value = false;
};

const handleEditSubmit = async () => {
  if (!editFormRef.value) return;
  if (!await editFormRef.value.validate()) return;
  try {
    await updateUser(editForm.value.id, editForm.value);
    ElMessage.success('更新用户信息成功!');
    // 关闭弹窗
    handleEditCancel();
    // 重新加载数据
    await handleQuery();
  } catch (e) {
    ElMessage.error(e.message || '更新用户信息失败!');
  }
};

const handleQuery = async () => {
  try {
    loading.value = true;
    data.value = await getUserList({
      ...filterObject(query),
      page: data.value.pagination.currentPage,
      limit: data.value.pagination.itemsPerPage
    });
  } catch (e) {
    ElMessage.error(e.message || '加载用户列表失败!');
  } finally {
    loading.value = false;
  }
};

const loadCcbServer = async () => {
  try {
    ccbServer = await getServerList();
  } catch (e) {
    ElMessage.error(e.message || '加载查分服务器列表失败!');
  }
};

onMounted(async () => {
  await loadCcbServer();
  await handleQuery();
});

// 表格的格式化函数
const userRankDict = ['普通用户', '初级用户', '中级用户', '高级用户', '贵宾用户', '系统管理员'];
const rankSpDict = ['无', 'maimoller', '协同管理员'];
const authDict = ['未认证', '个人认证', '官方认证'];
const banStateDict = ['正常', '受限', '封禁'];

const avatarFormat = (row) => joinUrl(avatarUrl, row.avatar ? row.avatar : 'default_avatar.png');
const userRankFormat = (row) => userRankDict[row.user_rank];
const rankSpFormat = (row) => rankSpDict[row.rankSp];
const authFormat = (row) => authDict[row.account_auth];
const banStateFormat = (row) => banStateDict[row.banState];
const serverFormat = (row) => {
  if (!row.game_server)
    return '无';
  const server = ccbServer.find(server => server.server_url === row.game_server);
  return server ? server.server_name : row.game_server;
};
</script>

<template>
  <div class="section">
    <h1 class="page-title" data-i18n="userManager.title">用户管理</h1>
    <div class="user-manager-container">
      <div class="user-search-section">
        <el-form :inline="true" :model="query">
          <el-form-item label="搜索">
            <el-input v-model="query.search" placeholder="用户ID、用户名或邮箱" clearable/>
          </el-form-item>
          <el-form-item label="用户组">
            <el-select v-model="query.user_rank" placeholder="用户组" clearable>
              <el-option :label="v" :value="i" v-for="(v, i) in userRankDict"/>
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.banState" placeholder="状态" clearable>
              <el-option :label="v" :value="i" v-for="(v, i) in banStateDict"/>
            </el-select>
          </el-form-item>
          <el-form-item label="认证">
            <el-select v-model="query.account_auth" placeholder="认证" clearable>
              <el-option :label="v" :value="i" v-for="(v, i) in authDict"/>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">筛选</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="user-table-container">
        <el-table :data="data.users" v-loading="loading" stripe style="width: 100%">
          <el-table-column prop="avatar" label="头像" width="70">
            <template #default="scope">
              <el-avatar :src="avatarFormat(scope.row)"/>
            </template>
          </el-table-column>
          <el-table-column prop="uid" label="UID"/>
          <el-table-column prop="username" label="用户名"/>
          <el-table-column prop="nickname" label="昵称"/>
          <el-table-column prop="email" label="邮箱"/>
          <el-table-column prop="user_rank" label="用户组" :formatter="userRankFormat"/>
          <el-table-column prop="rankSp" label="特殊等级" :formatter="rankSpFormat"/>
          <el-table-column prop="account_auth" label="账户认证" :formatter="authFormat"/>
          <el-table-column prop="points" label="积分"/>
          <el-table-column prop="point2" label="鸽屋积分"/>
          <el-table-column prop="game_server" label="游戏服务器" :formatter="serverFormat"/>
          <el-table-column prop="keychip" label="Keychip"/>
          <el-table-column prop="guid" label="Access Code"/>
          <el-table-column prop="banState" label="状态" :formatter="banStateFormat"/>
          <el-table-column label="操作" min-width="120">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div id="user-pagination" class="pagination-container">
          <el-pagination
              v-model:current-page="data.pagination.currentPage"
              v-model:page-size="data.pagination.itemsPerPage"
              :total="data.pagination.totalItems"
              :page-sizes="[50, 100, 300, 500]"
              layout="total, sizes, prev, pager, next, jumper"
              :background="true"
              @size-change="handleQuery"
              @current-change="handleQuery"
          />
        </div>
      </div>
    </div>
  </div>
  <el-dialog v-model="editFormVisible" title="编辑用户" width="500">
    <el-form ref="editFormRef" :model="editForm" :rules="editFormRules" label-width="auto">
      <el-form-item label="头像" prop="avatar">
        <el-input v-model="editForm.avatar" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="用户名" prop="username">
        <el-input v-model="editForm.username" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="editForm.nickname" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="editForm.email" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="用户组" prop="user_rank">
        <el-select v-model="editForm.user_rank" placeholder="用户组">
          <el-option :label="v" :value="i" v-for="(v, i) in userRankDict"/>
        </el-select>
      </el-form-item>
      <el-form-item label="特殊等级" prop="rankSp">
        <el-select v-model="editForm.rankSp" placeholder="特殊等级">
          <el-option :label="v" :value="i" v-for="(v, i) in rankSpDict"/>
        </el-select>
      </el-form-item>
      <el-form-item label="账户认证" prop="account_auth">
        <el-select v-model="editForm.account_auth" placeholder="账户认证">
          <el-option :label="v" :value="i" v-for="(v, i) in authDict"/>
        </el-select>
      </el-form-item>
      <el-form-item label="积分" prop="points">
        <el-input v-model.number="editForm.points" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="鸽屋积分" prop="point2">
        <el-input v-model.number="editForm.point2" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="游戏服务器" prop="game_server">
        <el-input v-model="editForm.game_server" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="Keychip" prop="keychip">
        <el-input v-model="editForm.keychip" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="AccessCode" prop="guid">
        <el-input v-model="editForm.guid" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="状态" prop="banState">
        <el-select v-model="editForm.banState" placeholder="状态">
          <el-option :label="v" :value="i" v-for="(v, i) in banStateDict"/>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleEditCancel">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.user-search-section .el-input {
  --el-input-width: 200px;
}

.user-search-section .el-select {
  --el-select-width: 120px;
}
</style>