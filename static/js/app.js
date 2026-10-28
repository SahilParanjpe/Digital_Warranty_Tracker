/**
 * Digital Warranty Tracker - Role-Based SaaS Client Application
 * Full interactive controller supporting 4 distinct user roles:
 * 1. Product Owner
 * 2. Service Staff
 * 3. Technician
 * 4. Admin
 */

// Global App State
const state = {
  currentRole: 'product_owner',
  currentUser: null,
  authenticatedUser: null,
  authSelectedRole: 'product_owner',
  authMode: 'signin',
  currentView: 'auth', // Starts at login/signup portal
  isSidebarCollapsed: false,
  products: [],
  claims: [],
  serviceRequests: [],
  rules: [],
  reminders: [],
  technicians: [],
  users: [],
  analytics: null,
  activeWorkOrder: null
};

// Demo Users for the 4 Roles
const demoUsers = {
  product_owner: {
    id: 1,
    name: 'Alex Vance',
    email: 'alex@owner.com',
    role: 'product_owner',
    title: 'Product Owner',
    org: 'Individual Consumer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  service_center_staff: {
    id: 2,
    name: 'Sarah Connor',
    email: 'sarah@servicecenter.com',
    role: 'service_center_staff',
    title: 'Service Dispatcher',
    org: 'Metro Central Service Hub',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
  },
  service_technician: {
    id: 3,
    name: 'David Miller',
    email: 'david@technician.com',
    role: 'service_technician',
    title: 'Senior Hardware Tech',
    org: 'Apex Repairs & Bay Services',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  warranty_admin: {
    id: 4,
    name: 'Elena Rostova',
    email: 'elena@admin.com',
    role: 'warranty_admin',
    title: 'System Administrator',
    org: 'Global Warranty Underwriters Ltd',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80'
  }
};

const authRoleDetails = {
  product_owner: {
    key: 'product_owner',
    title: 'Product Owner',
    tagline: 'Consumer & Asset Holder',
    sub: 'Manage registered products, AI OCR invoices, countdowns & claims',
    icon: '👤',
    demoUser: demoUsers.product_owner
  },
  service_center_staff: {
    key: 'service_center_staff',
    title: 'Service Staff',
    tagline: 'Queue & Bay Dispatch',
    sub: 'Triage repair tickets, verify claims, allocate technician bays & monitor SLAs',
    icon: '🏢',
    demoUser: demoUsers.service_center_staff
  },
  service_technician: {
    key: 'service_technician',
    title: 'Technician',
    tagline: 'Diagnostic Bench',
    sub: 'Bench diagnosis, root cause reporting, parts requisitions & repair completion',
    icon: '🔧',
    demoUser: demoUsers.service_technician
  },
  warranty_admin: {
    key: 'warranty_admin',
    title: 'Admin',
    tagline: 'System & Policies',
    sub: 'Real-time analytics, user accounts, coverage rules, audit logs & CSV exports',
    icon: '🛡️',
    demoUser: demoUsers.warranty_admin
  }
};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Clear any legacy cross-tab localStorage so tabs never interfere with each other
  try {
    localStorage.removeItem('dwt_auth_user');
    localStorage.removeItem('dwt_current_view');
  } catch (e) {}

  const savedUser = sessionStorage.getItem('dwt_auth_user');
  const savedView = sessionStorage.getItem('dwt_current_view') || 'dashboard';

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.id && user.role) {
        state.authenticatedUser = user;
        state.currentUser = user;
        state.currentRole = user.role;
        updateUserUI();
        updateTopBarAuthState();
        const targetView = (savedView === 'auth') ? 'dashboard' : savedView;
        showView(targetView);
        switchRole(user.role);
        loadReminders();
        return;
      }
    } catch (e) {
      console.warn('Error reading saved session from sessionStorage:', e);
    }
  }

  // If no active session in this tab, show auth portal
  state.authenticatedUser = null;
  state.currentUser = null;
  updateTopBarAuthState();
  showView('auth');
  selectAuthRole('product_owner');
  setMainAuthMode('signin');
  loadReminders();
}

// -------------------------------------------------------------
// VIEW NAVIGATION (Auth / Hero / Dashboard)
// -------------------------------------------------------------
function showView(viewName) {
  state.currentView = viewName;
  if (state.currentUser && viewName !== 'auth') {
    sessionStorage.setItem('dwt_current_view', viewName);
  }
  const authEl = document.getElementById('view-auth');
  const heroEl = document.getElementById('view-hero');
  const dashEl = document.getElementById('view-dashboard');

  if (viewName === 'auth') {
    if (authEl) authEl.classList.remove('hidden');
    if (heroEl) heroEl.classList.add('hidden');
    if (dashEl) dashEl.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (viewName === 'hero') {
    if (authEl) authEl.classList.add('hidden');
    if (heroEl) heroEl.classList.remove('hidden');
    if (dashEl) dashEl.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (viewName === 'dashboard') {
    if (!state.currentUser) {
      showToast('Please sign in or select a demo role first.');
      showView('auth');
      return;
    }
    if (authEl) authEl.classList.add('hidden');
    if (heroEl) heroEl.classList.add('hidden');
    if (dashEl) dashEl.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// -------------------------------------------------------------
// COLLAPSIBLE SIDEBAR & RESPONSIVE TOGGLES
// -------------------------------------------------------------
function toggleSidebarCollapse() {
  state.isSidebarCollapsed = !state.isSidebarCollapsed;
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;

  if (state.isSidebarCollapsed) {
    sidebar.classList.remove('md:w-64');
    sidebar.classList.add('md:w-20');
    document.querySelectorAll('.sidebar-label').forEach(el => el.classList.add('hidden'));
    document.querySelector('.sidebar-search-box')?.classList.add('hidden');
  } else {
    sidebar.classList.remove('md:w-20');
    sidebar.classList.add('md:w-64');
    document.querySelectorAll('.sidebar-label').forEach(el => el.classList.remove('hidden'));
    document.querySelector('.sidebar-search-box')?.classList.remove('hidden');
  }
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('hidden');
  }
}

function updateSidebarNav() {
  const container = document.getElementById('sidebar-nav-container');
  if (!container) return;

  const role = state.currentRole;
  let navHtml = '';

  if (role === 'product_owner') {
    navHtml = `
      <div>
        <div class="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-2 mb-2 sidebar-label">My Workspace</div>
        <nav class="space-y-1 text-xs">
          <button onclick="scrollToSection('kpi-cards-grid')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium bg-[#111418] text-white transition">
            <span>📊</span><span class="sidebar-label">Overview</span>
          </button>
          <button onclick="scrollToSection('po-section-products')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <div class="flex items-center gap-3"><span>💻</span><span class="sidebar-label">My Products</span></div>
            <span class="sidebar-label text-gray-400 font-semibold" id="side-po-prod-count">4</span>
          </button>
          <button onclick="scrollToSection('po-section-warranties')" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <span>🛡️</span><span class="sidebar-label">Warranty Details</span>
          </button>
          <button onclick="scrollToSection('po-section-service')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <div class="flex items-center gap-3"><span>🔧</span><span class="sidebar-label">Service Requests</span></div>
            <span class="sidebar-label text-blue-600 font-bold" id="side-po-sr-count">1</span>
          </button>
          <button onclick="openRemindersDrawer()" class="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <div class="flex items-center gap-3"><span>🔔</span><span class="sidebar-label">Notifications</span></div>
            <span class="sidebar-label bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full" id="side-unread-count">3</span>
          </button>
        </nav>
      </div>
      <div>
        <div class="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-2 mb-2 sidebar-label">Quick Actions</div>
        <nav class="space-y-1 text-xs">
          <button onclick="openOcrModal()" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-gray-700 bg-emerald-50 hover:bg-emerald-100 transition">
            <span>⚡</span><span class="sidebar-label font-bold text-emerald-800">OCR Receipt Scan</span>
          </button>
          <button onclick="openServiceRequestModal()" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <span>+</span><span class="sidebar-label">Request Repair</span>
          </button>
        </nav>
      </div>
    `;
  } else if (role === 'service_center_staff') {
    navHtml = `
      <div>
        <div class="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-2 mb-2 sidebar-label">Dispatch Desk</div>
        <nav class="space-y-1 text-xs">
          <button onclick="scrollToSection('kpi-cards-grid')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium bg-[#111418] text-white transition">
            <span>📊</span><span class="sidebar-label">Overview</span>
          </button>
          <button onclick="scrollToSection('staff-section-product-verifications')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <div class="flex items-center gap-3"><span>🔍</span><span class="sidebar-label">Product Verifications</span></div>
            <span class="sidebar-label text-purple-600 font-bold" id="side-staff-verify-count">2</span>
          </button>
          <button onclick="scrollToSection('staff-section-claims')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <div class="flex items-center gap-3"><span>🛡️</span><span class="sidebar-label">Claims Adjudication</span></div>
            <span class="sidebar-label text-amber-600 font-bold" id="side-staff-claims-count">2</span>
          </button>
          <button onclick="scrollToSection('staff-section-queue')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <div class="flex items-center gap-3"><span>📋</span><span class="sidebar-label">Service Queue</span></div>
            <span class="sidebar-label text-blue-600 font-bold" id="side-staff-queue-count">4</span>
          </button>
          <button onclick="scrollToSection('staff-section-dispatch')" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <span>👥</span><span class="sidebar-label">Tech Bay Fleet</span>
          </button>
          <button onclick="openRemindersDrawer()" class="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <div class="flex items-center gap-3"><span>🔔</span><span class="sidebar-label">SLA Alerts</span></div>
            <span class="sidebar-label bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
          </button>
        </nav>
      </div>
    `;
  } else if (role === 'service_technician') {
    navHtml = `
      <div>
        <div class="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-2 mb-2 sidebar-label">Technician Bench</div>
        <nav class="space-y-1 text-xs">
          <button onclick="scrollToSection('kpi-cards-grid')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium bg-[#111418] text-white transition">
            <span>📊</span><span class="sidebar-label">Overview</span>
          </button>
          <button onclick="scrollToSection('tech-section-jobs')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <div class="flex items-center gap-3"><span>🔧</span><span class="sidebar-label">My Assigned Jobs</span></div>
            <span class="sidebar-label text-emerald-600 font-bold" id="side-tech-jobs-count">2</span>
          </button>
          <button onclick="scrollToSection('tech-section-parts')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <div class="flex items-center gap-3"><span>📦</span><span class="sidebar-label">Parts Requisitions</span></div>
            <span class="sidebar-label text-gray-500 font-bold" id="side-tech-parts-count">1</span>
          </button>
          <button onclick="openRemindersDrawer()" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <span>🔔</span><span class="sidebar-label">Bench Alerts</span>
          </button>
        </nav>
      </div>
    `;
  } else {
    // warranty_admin
    navHtml = `
      <div>
        <div class="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-2 mb-2 sidebar-label">System Control</div>
        <nav class="space-y-1 text-xs">
          <button onclick="scrollToSection('kpi-cards-grid')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium bg-[#111418] text-white transition">
            <span>📊</span><span class="sidebar-label">Overview</span>
          </button>
          <button onclick="scrollToSection('admin-section-analytics')" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <span>📈</span><span class="sidebar-label">Analytics & Charts</span>
          </button>
          <button onclick="scrollToSection('admin-section-users')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <div class="flex items-center gap-3"><span>👥</span><span class="sidebar-label">User Management</span></div>
            <span class="sidebar-label text-gray-400 font-bold" id="side-admin-user-count">4</span>
          </button>
          <button onclick="scrollToSection('admin-section-policies')" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <span>📜</span><span class="sidebar-label">Warranty Policies</span>
          </button>
          <button onclick="scrollToSection('admin-section-audit')" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <span>📑</span><span class="sidebar-label">System Audit Logs</span>
          </button>
          <button onclick="scrollToSection('admin-section-reports')" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition">
            <span>📥</span><span class="sidebar-label">CSV Reports Export</span>
          </button>
        </nav>
      </div>
    `;
  }

  container.innerHTML = navHtml;
}

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// -------------------------------------------------------------
// ROLE SWITCHING & ROLE-BASED DASHBOARD DISPATCHER
// -------------------------------------------------------------
function switchRole(roleKey, forceDemo = false) {
  if (!authRoleDetails[roleKey]) return;
  state.currentRole = roleKey;

  // If the authenticated user belongs to this role, preserve their real name and profile!
  if (state.authenticatedUser && state.authenticatedUser.role === roleKey && !forceDemo) {
    state.currentUser = state.authenticatedUser;
    sessionStorage.setItem('dwt_auth_user', JSON.stringify(state.authenticatedUser));
  } else if (!state.currentUser || forceDemo || (state.currentUser && state.currentUser.role !== roleKey)) {
    // If previewing a different role than authenticated, use the role demo profile
    if (demoUsers[roleKey]) {
      state.currentUser = { ...demoUsers[roleKey] };
      if (!state.authenticatedUser) {
        sessionStorage.setItem('dwt_auth_user', JSON.stringify(state.currentUser));
      }
    }
  } else {
    if (state.currentUser) {
      sessionStorage.setItem('dwt_auth_user', JSON.stringify(state.currentUser));
    }
  }

  // Update testing role buttons highlight
  const allRoles = ['product_owner', 'service_center_staff', 'service_technician', 'warranty_admin'];
  allRoles.forEach(r => {
    const btn = document.getElementById(`test-role-btn-${r}`);
    if (btn) {
      if (r === roleKey) {
        const activeStyles = {
          product_owner: 'bg-blue-600 text-white shadow-2xs font-bold',
          service_center_staff: 'bg-amber-600 text-white shadow-2xs font-bold',
          service_technician: 'bg-emerald-600 text-white shadow-2xs font-bold',
          warranty_admin: 'bg-purple-600 text-white shadow-2xs font-bold'
        };
        btn.className = `px-2.5 py-1 rounded-xl text-xs transition-all flex items-center gap-1 ${activeStyles[r] || 'bg-black text-white font-bold'}`;
      } else {
        btn.className = 'px-2.5 py-1 rounded-xl text-xs transition-all flex items-center gap-1 text-gray-600 hover:text-black hover:bg-white/80 font-medium';
      }
    }
  });

  // Update Breadcrumb and Header
  const breadcrumb = document.getElementById('top-breadcrumb');
  if (breadcrumb) {
    const titles = {
      product_owner: 'Product Owner Dashboard',
      service_center_staff: 'Service Staff Intake & Bay Desk',
      service_technician: 'Technician Workbench',
      warranty_admin: 'System Administrator Control Center'
    };
    breadcrumb.textContent = titles[roleKey] || 'Dashboard';
  }

  // Update Topbar action button
  const topActionContainer = document.getElementById('topbar-role-action-btn');
  if (topActionContainer) {
    if (roleKey === 'product_owner') {
      topActionContainer.innerHTML = `
        <button onclick="openOcrModal()" class="inline-flex items-center gap-1.5 bg-[#111418] hover:bg-black text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs">
          <span>+</span><span>Register Product</span>
        </button>
      `;
    } else if (roleKey === 'service_center_staff') {
      topActionContainer.innerHTML = `
        <button onclick="openServiceRequestModal()" class="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs">
          <span>⚡</span><span>New Service Intake</span>
        </button>
      `;
    } else if (roleKey === 'service_technician') {
      topActionContainer.innerHTML = `
        <button onclick="loadTechJobs()" class="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs">
          <span>↻</span><span>Refresh Bench</span>
        </button>
      `;
    } else {
      topActionContainer.innerHTML = `
        <button onclick="openCreateUserModal()" class="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs">
          <span>+</span><span>New User Account</span>
        </button>
      `;
    }
  }

  // Update Context Banner
  const iconEl = document.getElementById('stakeholder-icon');
  const pillEl = document.getElementById('stakeholder-role-pill');
  const descEl = document.getElementById('stakeholder-desc');
  const sideBadge = document.getElementById('sidebar-role-badge');
  const meta = authRoleDetails[roleKey];

  if (iconEl) iconEl.textContent = meta.icon;
  if (pillEl) {
    pillEl.textContent = meta.title;
    const colors = {
      product_owner: 'bg-blue-100 text-blue-800',
      service_center_staff: 'bg-amber-100 text-amber-800',
      service_technician: 'bg-emerald-100 text-emerald-800',
      warranty_admin: 'bg-purple-100 text-purple-800'
    };
    pillEl.className = `px-2.5 py-0.5 rounded-full text-[10px] font-bold ${colors[roleKey] || 'bg-blue-100 text-blue-800'}`;
  }
  if (descEl) descEl.textContent = meta.sub;
  if (sideBadge) sideBadge.textContent = meta.title;

  // Toggle Role Sections Containers
  const roleSections = [
    'role-section-product_owner',
    'role-section-service_center_staff',
    'role-section-service_technician',
    'role-section-warranty_admin'
  ];
  roleSections.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.add('hidden');
  });

  const activeSection = document.getElementById(`role-section-${roleKey}`);
  if (activeSection) {
    activeSection.classList.remove('hidden');
  }

  updateUserUI();
  updateSidebarNav();
  showToast(`Switched to ${meta.title} workspace: ${state.currentUser.name}`);

  // Fetch role-specific backend data
  loadDashboardStats();
  loadReminders();
  if (roleKey === 'product_owner') {
    loadPoProducts();
    loadPoServiceRequests();
  } else if (roleKey === 'service_center_staff') {
    loadStaffServiceQueue();
    loadStaffClaims();
    loadStaffProductVerifications();
    loadStaffTechsWorkload();
  } else if (roleKey === 'service_technician') {
    loadTechJobs();
    loadTechPartsRequests();
  } else if (roleKey === 'warranty_admin') {
    loadAdminAnalytics();
    loadAdminUsers();
    loadAdminPolicies();
    loadAdminAuditLogs();
  }
}

function updateUserUI() {
  const user = state.currentUser;
  if (!user) return;

  const sideName = document.getElementById('current-user-name');
  const sideRole = document.getElementById('current-user-role-label');
  const sideInitials = document.getElementById('user-avatar-initials');
  const topAvatar = document.getElementById('top-user-avatar');
  const topName = document.getElementById('topbar-user-name');
  const topRole = document.getElementById('topbar-user-role');
  const designatedRoleBadge = document.getElementById('topbar-designated-role-badge');
  const designatedRoleDot = document.getElementById('topbar-designated-role-dot');
  const designatedRoleText = document.getElementById('topbar-designated-role-text');

  const displayName = user.name || 'User Account';
  const roleName = formatRoleName(user.role);
  if (sideName) sideName.textContent = displayName;
  if (sideRole) sideRole.textContent = roleName;
  if (topName) topName.textContent = displayName;
  if (topRole) topRole.textContent = roleName;

  if (designatedRoleText) designatedRoleText.textContent = roleName;
  if (designatedRoleBadge && designatedRoleDot) {
    const roleStyleMap = {
      product_owner: { badge: 'border-blue-200 bg-blue-50 text-blue-700', dot: 'bg-blue-600' },
      service_center_staff: { badge: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-600' },
      service_technician: { badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600' },
      warranty_admin: { badge: 'border-purple-200 bg-purple-50 text-purple-700', dot: 'bg-purple-600' }
    };
    const style = roleStyleMap[user.role] || roleStyleMap.product_owner;
    designatedRoleBadge.className = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${style.badge}`;
    designatedRoleDot.className = `w-1.5 h-1.5 rounded-full ${style.dot}`;
  }

  if (sideInitials && displayName) {
    const parts = displayName.trim().split(/\s+/);
    const initials = ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '')).toUpperCase() || 'U';
    sideInitials.textContent = initials;
  }

  const avatarSrc = user.avatar_url || user.avatar;
  if (topAvatar) {
    if (avatarSrc) {
      topAvatar.src = avatarSrc;
    } else {
      const encodedName = encodeURIComponent(displayName);
      topAvatar.src = `https://ui-avatars.com/api/?name=${encodedName}&background=2563eb&color=fff&bold=true`;
    }
  }
}

// -------------------------------------------------------------
// OVERVIEW CARDS (LOADED FROM REAL SQL /api/dashboard/stats)
// -------------------------------------------------------------
async function loadDashboardStats() {
  if (!state.currentUser) return;
  try {
    const res = await fetch(`/api/dashboard/stats?role=${state.currentRole}&user_id=${state.currentUser.id}`);
    const json = await res.json();
    if (json.success && json.cards) {
      renderKpiCards(json.cards);
    }
  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
  }
}

function renderKpiCards(cards) {
  const grid = document.getElementById('kpi-cards-grid');
  if (!grid) return;

  grid.innerHTML = cards.map(c => `
    <div class="crm-card p-5 hover:border-gray-300 transition-all">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500">${c.title}</span>
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">${c.badge}</span>
      </div>
      <div class="flex items-baseline gap-2 mt-2">
        <span class="text-2xl sm:text-3xl font-black text-gray-900">${c.value}</span>
        <span class="text-base">${c.icon}</span>
      </div>
      <div class="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>${c.sub}</span>
        <svg class="w-16 h-5 text-emerald-500" viewBox="0 0 100 25" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M0 20 Q 30 5, 60 15 T 100 2" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// 1. PRODUCT OWNER DASHBOARD LOGIC
// -------------------------------------------------------------
async function loadPoProducts() {
  if (!state.currentUser) return;
  try {
    const res = await fetch(`/api/products?owner_id=${state.currentUser.id}`);
    const json = await res.json();
    if (json.success) {
      state.products = json.products;
      renderPoProductsTable(json.products);
      renderPoWarrantiesGrid(json.products);
      const sideBadge = document.getElementById('side-po-prod-count');
      if (sideBadge) sideBadge.textContent = json.products.length;
    }
  } catch (err) {
    console.error('Failed to load PO products:', err);
  }
}

function renderPoProductsTable(products) {
  const tbody = document.getElementById('po-products-table-body');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">No registered products found. Click "Register New Product" above.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    let statusBadge = '<span class="badge-status badge-active">Active</span>';
    if (p.status === 'expiring_soon') {
      statusBadge = '<span class="badge-status badge-expiring">Expiring Soon</span>';
    } else if (p.status === 'expired') {
      statusBadge = '<span class="badge-status badge-expired">Expired</span>';
    }

    let verifyBadge = '';
    if (p.verification_status === 'verified') {
      verifyBadge = '<span class="badge-status badge-verified bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 font-semibold">✓ Verified</span>';
    } else if (p.verification_status === 'rejected') {
      verifyBadge = `<span class="badge-status bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-1 font-bold" title="${p.verification_notes || 'Rejected by staff'}">✕ Rejected</span>`;
    } else {
      verifyBadge = '<span class="badge-status bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1 font-semibold animate-pulse">⏳ Pending Staff Verification</span>';
    }

    return `
      <tr class="hover:bg-gray-50/60 transition">
        <td class="py-3.5 px-4">
          <div class="font-bold text-gray-900">${p.product_name}</div>
          <div class="text-[11px] text-gray-500">${p.brand} · ${p.model_number || 'Standard Model'}</div>
        </td>
        <td class="py-3.5 px-4 font-mono font-medium text-gray-700">${p.serial_number}</td>
        <td class="py-3.5 px-4 text-gray-600">${p.purchase_date}</td>
        <td class="py-3.5 px-4 font-semibold text-gray-900">${p.warranty_end_date}</td>
        <td class="py-3.5 px-4">${statusBadge}</td>
        <td class="py-3.5 px-4">${verifyBadge}</td>
        <td class="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
          <button onclick="openCertificateModal(${p.id})" class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition">
            📜 Certificate
          </button>
          <button onclick="viewInvoice(${p.id}, '${p.product_name.replace(/'/g, "\\'")}', '${p.invoice_filename || 'Invoice.pdf'}', '${p.serial_number}', '${p.purchase_price}')" class="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[11px] transition">
            Receipt
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPoWarrantiesGrid(products) {
  const grid = document.getElementById('po-warranties-card-grid');
  if (!grid) return;

  grid.innerHTML = products.map(p => {
    const today = new Date('2026-07-25');
    const end = new Date(p.warranty_end_date);
    const diffDays = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));

    let cardVerifyBadge = '';
    if (p.verification_status === 'verified') {
      cardVerifyBadge = '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">✓ Verified</span>';
    } else if (p.verification_status === 'rejected') {
      cardVerifyBadge = '<span class="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">✕ Rejected</span>';
    } else {
      cardVerifyBadge = '<span class="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">⏳ Pending Verification</span>';
    }

    return `
      <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-sm text-gray-900 truncate">${p.product_name}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${diffDays > 30 ? 'bg-emerald-100 text-emerald-800' : diffDays > 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}">
              ${diffDays > 0 ? diffDays + ' Days Left' : 'Expired'}
            </span>
          </div>
          <div class="text-[11px] text-gray-500 font-mono mb-3">S/N: ${p.serial_number}</div>

          <div class="space-y-1.5 text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div class="flex justify-between">
              <span>Start Date:</span>
              <span class="font-medium text-gray-900">${p.warranty_start_date}</span>
            </div>
            <div class="flex justify-between">
              <span>Expiry Date:</span>
              <span class="font-bold text-gray-900">${p.warranty_end_date}</span>
            </div>
            <div class="flex justify-between">
              <span>Coverage Plan:</span>
              <span class="font-medium capitalize text-blue-700">${p.warranty_type.replace('_', ' ')}</span>
            </div>
            <div class="flex justify-between items-center pt-1 border-t border-gray-200/60">
              <span>Warranty Status:</span>
              <span>${cardVerifyBadge}</span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <button onclick="openCertificateModal(${p.id})" class="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition text-center shadow-xs">
            Download Certificate
          </button>
          <button onclick="quickFileClaimForProduct(${p.id}, '${p.product_name}')" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1.5 px-3 rounded-xl text-xs transition">
            File Claim
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function loadPoServiceRequests() {
  if (!state.currentUser) return;
  try {
    const res = await fetch(`/api/service-requests?owner_id=${state.currentUser.id}`);
    const json = await res.json();
    if (json.success) {
      renderPoServiceTable(json.service_requests);
      const sideSrBadge = document.getElementById('side-po-sr-count');
      if (sideSrBadge) sideSrBadge.textContent = json.service_requests.length;
    }
  } catch (err) {
    console.error('Failed to load PO service requests:', err);
  }
}

function renderPoServiceTable(requests) {
  const tbody = document.getElementById('po-service-table-body');
  if (!tbody) return;

  if (requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-400">No active service requests. You can submit one anytime.</td></tr>`;
    return;
  }

  tbody.innerHTML = requests.map(r => {
    const canCancel = r.status === 'pending' || r.status === 'draft';
    const statusColors = {
      pending: 'bg-amber-100 text-amber-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      awaiting_parts: 'bg-orange-100 text-orange-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-gray-100 text-gray-500'
    };

    return `
      <tr class="hover:bg-gray-50/60 transition">
        <td class="py-3.5 px-4 font-mono font-bold text-gray-900">${r.request_number}</td>
        <td class="py-3.5 px-4">
          <div class="font-bold text-gray-900">${r.product_name}</div>
          <div class="text-[11px] text-gray-500">${r.brand} · ${r.serial_number}</div>
        </td>
        <td class="py-3.5 px-4 text-gray-800 max-w-xs truncate" title="${r.issue_title}">${r.issue_title}</td>
        <td class="py-3.5 px-4 text-gray-600">${r.created_at ? r.created_at.split(' ')[0] : 'Today'}</td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[r.status] || 'bg-gray-100 text-gray-800'}">
            ${r.status.toUpperCase().replace('_', ' ')}
          </span>
        </td>
        <td class="py-3.5 px-4 text-gray-700">
          ${r.technician_name ? `<span>👨‍🔧 ${r.technician_name}</span>` : '<span class="text-gray-400 italic">Assigning...</span>'}
        </td>
        <td class="py-3.5 px-4 font-mono text-[11px] text-gray-600">${r.scheduled_slot || 'Pending slot'}</td>
        <td class="py-3.5 px-4 text-right whitespace-nowrap">
          ${canCancel ? `
            <button onclick="openCancelRequestModal(${r.id}, '${r.request_number}')" class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-[11px] transition">
              Cancel Request
            </button>
          ` : `<span class="text-gray-400 text-[11px]">—</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// 2. SERVICE STAFF DASHBOARD LOGIC
// -------------------------------------------------------------
async function loadStaffServiceQueue() {
  const searchVal = document.getElementById('staff-search-input')?.value || '';
  const priorityVal = document.getElementById('staff-priority-filter')?.value || 'all';
  const statusVal = document.getElementById('staff-status-filter')?.value || 'all';

  const query = new URLSearchParams();
  if (priorityVal !== 'all') query.append('priority', priorityVal);
  if (statusVal !== 'all') query.append('status', statusVal);
  if (searchVal) query.append('search', searchVal);

  try {
    const res = await fetch(`/api/service-requests?${query.toString()}`);
    const json = await res.json();
    if (json.success) {
      renderStaffQueueTable(json.service_requests);
      const sideQueueBadge = document.getElementById('side-staff-queue-count');
      if (sideQueueBadge) sideQueueBadge.textContent = json.service_requests.length;
    }
  } catch (err) {
    console.error('Failed to load staff service queue:', err);
  }
}

function renderStaffQueueTable(requests) {
  const tbody = document.getElementById('staff-queue-table-body');
  if (!tbody) return;

  if (requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-gray-400">No service requests found in this queue.</td></tr>`;
    return;
  }

  tbody.innerHTML = requests.map(r => {
    const priorityColors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-amber-100 text-amber-800 border-amber-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return `
      <tr class="hover:bg-gray-50/60 transition">
        <td class="py-3.5 px-4 font-mono font-bold text-gray-900">${r.request_number}</td>
        <td class="py-3.5 px-4">
          <div class="font-bold text-gray-900">${r.owner_name}</div>
          <div class="text-[11px] text-gray-500">${r.owner_email || ''}</div>
        </td>
        <td class="py-3.5 px-4">
          <div class="font-semibold text-gray-900">${r.product_name}</div>
          <div class="text-[11px] font-mono text-gray-500">${r.serial_number}</div>
        </td>
        <td class="py-3.5 px-4 text-gray-700 max-w-xs truncate" title="${r.issue_title}">
          <div class="font-medium">${r.issue_title}</div>
          ${r.scheduled_slot && r.scheduled_slot !== 'Pending Bay Slot' ? `<div class="text-[10px] text-blue-600 font-mono mt-0.5 font-semibold">📅 Slot: ${r.scheduled_slot}</div>` : (r.preferred_datetime ? `<div class="text-[10px] text-purple-600 font-mono mt-0.5 font-semibold">📅 Pref: ${r.preferred_datetime}</div>` : '')}
        </td>
        <td class="py-3.5 px-4 text-gray-600">${r.created_at ? r.created_at.split(' ')[0] : 'Today'}</td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityColors[r.priority] || priorityColors.medium}">
            ${r.priority.toUpperCase()}
          </span>
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">
            ${r.status.toUpperCase().replace('_', ' ')}
          </span>
        </td>
        <td class="py-3.5 px-4 text-gray-700">
          ${r.technician_name ? `<span class="font-medium text-emerald-700">👨‍🔧 ${r.technician_name}</span>` : '<span class="text-amber-600 font-bold">Unassigned</span>'}
        </td>
        <td class="py-3.5 px-4 text-right whitespace-nowrap">
          <button onclick="openTechAssignModal(${r.id}, '${r.request_number}', '${encodeURIComponent(r.scheduled_slot || r.preferred_datetime || '')}')" class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-xs">
            ${r.assigned_technician_id ? 'Reassign Tech' : 'Assign Tech'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadStaffClaims() {
  try {
    const res = await fetch('/api/claims');
    const json = await res.json();
    if (json.success) {
      renderStaffClaimsTable(json.claims);
      const sideClaimsBadge = document.getElementById('side-staff-claims-count');
      if (sideClaimsBadge) sideClaimsBadge.textContent = json.claims.length;
    }
  } catch (err) {
    console.error('Failed to load staff claims:', err);
  }
}

function renderStaffClaimsTable(claims) {
  const tbody = document.getElementById('staff-claims-table-body');
  if (!tbody) return;

  if (claims.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">No warranty claims awaiting verification.</td></tr>`;
    return;
  }

  tbody.innerHTML = claims.map(c => `
    <tr class="hover:bg-gray-50/60 transition">
      <td class="py-3.5 px-4 font-mono font-bold text-gray-900">${c.claim_number}</td>
      <td class="py-3.5 px-4">
        <div class="font-bold text-gray-900">${c.product_name}</div>
        <div class="text-[11px] font-mono text-gray-500">${c.serial_number}</div>
      </td>
      <td class="py-3.5 px-4 font-medium text-gray-800">${c.owner_name}</td>
      <td class="py-3.5 px-4 text-gray-700 max-w-xs truncate" title="${c.issue_description}">
        <div>${c.issue_description}</div>
        ${c.preferred_datetime ? `<div class="text-[10px] text-blue-600 font-semibold mt-0.5">📅 Pref: ${c.preferred_datetime}</div>` : ''}
      </td>
      <td class="py-3.5 px-4">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'service_scheduled' ? 'bg-emerald-100 text-emerald-800' : c.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}">
          ${c.status.toUpperCase().replace('_', ' ')}
        </span>
      </td>
      <td class="py-3.5 px-4 text-[11px] text-gray-600 max-w-xs truncate">
        ${c.rejection_reason ? `<span class="text-red-600 font-semibold">Rejected: ${c.rejection_reason}</span>` : c.admin_notes || 'Pending Adjudication'}
      </td>
      <td class="py-3.5 px-4 text-right whitespace-nowrap">
        <button onclick="openClaimDecisionModal(${c.id}, '${c.claim_number}', '${encodeURIComponent(c.preferred_datetime || '')}')" class="px-2.5 py-1 rounded-lg bg-black hover:bg-gray-800 text-white font-bold text-[11px] transition shadow-xs">
          Adjudicate ⚖️
        </button>
      </td>
    </tr>
  `).join('');
}

// -------------------------------------------------------------
// PRODUCT WARRANTY & INVOICE VERIFICATION DESK (STAFF)
// -------------------------------------------------------------
async function loadStaffProductVerifications() {
  const filterVal = document.getElementById('staff-product-verify-filter')?.value || 'all';
  const query = new URLSearchParams();
  if (filterVal !== 'all') {
    query.append('verification_status', filterVal);
  }

  try {
    const res = await fetch(`/api/products?${query.toString()}`);
    const json = await res.json();
    if (json.success) {
      renderStaffProductVerifications(json.products);

      // Count unverified products
      const unverifiedCount = json.products.filter(p => p.verification_status === 'unverified').length;
      const pendingBadge = document.getElementById('staff-pending-verifications-badge');
      if (pendingBadge) {
        if (unverifiedCount > 0) {
          pendingBadge.textContent = `${unverifiedCount} Pending Review`;
          pendingBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse';
        } else {
          pendingBadge.textContent = 'All Verified ✓';
          pendingBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
        }
      }
      const sideVerifyBadge = document.getElementById('side-staff-verify-count');
      if (sideVerifyBadge) sideVerifyBadge.textContent = unverifiedCount;
    }
  } catch (err) {
    console.error('Failed to load staff product verifications:', err);
  }
}

function renderStaffProductVerifications(products) {
  const tbody = document.getElementById('staff-products-table-body');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-400">No products found for this verification filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    let verifyBadge = '';
    if (p.verification_status === 'verified') {
      verifyBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Verified</span>';
    } else if (p.verification_status === 'rejected') {
      verifyBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200" title="${p.verification_notes || 'Rejected by staff'}">✕ Rejected</span>`;
    } else {
      verifyBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">⏳ Pending Verification</span>';
    }

    const actionButtons = p.verification_status === 'unverified'
      ? `
        <div class="flex items-center justify-end gap-1.5 whitespace-nowrap">
          <button onclick="verifyProductAction(${p.id}, 'verified', '${p.product_name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-2xs">
            Verify ✓
          </button>
          <button onclick="verifyProductAction(${p.id}, 'rejected', '${p.product_name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition shadow-2xs">
            Reject ✕
          </button>
        </div>
      `
      : p.verification_status === 'verified'
        ? `
          <div class="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <span class="text-[10px] text-emerald-700 font-semibold mr-1">Approved</span>
            <button onclick="verifyProductAction(${p.id}, 'rejected', '${p.product_name.replace(/'/g, "\\'")}')" class="px-2 py-1 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 font-semibold text-[10px] transition">
              Revoke
            </button>
          </div>
        `
        : `
          <div class="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <span class="text-[10px] text-red-700 font-semibold mr-1">Rejected</span>
            <button onclick="verifyProductAction(${p.id}, 'verified', '${p.product_name.replace(/'/g, "\\'")}')" class="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] transition">
              Re-Verify ✓
            </button>
          </div>
        `;

    return `
      <tr class="hover:bg-gray-50/60 transition">
        <td class="py-3.5 px-4">
          <div class="font-bold text-gray-900">${p.product_name}</div>
          <div class="text-[11px] text-gray-500">${p.brand} · ${p.model_number || 'Standard Model'}</div>
        </td>
        <td class="py-3.5 px-4 font-mono font-medium text-gray-800">${p.serial_number}</td>
        <td class="py-3.5 px-4">
          <div class="font-semibold text-gray-900">${p.owner_name}</div>
          <div class="text-[11px] text-gray-500">${p.owner_email || ''}</div>
        </td>
        <td class="py-3.5 px-4 text-gray-600">${p.purchase_date}</td>
        <td class="py-3.5 px-4 font-semibold text-gray-900">${p.warranty_end_date}</td>
        <td class="py-3.5 px-4">
          <button onclick="viewInvoice(${p.id}, '${p.product_name.replace(/'/g, "\\'")}', '${p.invoice_filename || 'Invoice.pdf'}', '${p.serial_number}', '${p.purchase_price}')" class="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[11px] transition">
            📄 Receipt
          </button>
        </td>
        <td class="py-3.5 px-4">${verifyBadge}</td>
        <td class="py-3.5 px-4 text-right">${actionButtons}</td>
      </tr>
    `;
  }).join('');
}

async function verifyProductAction(productId, status, productName) {
  let notes = '';
  if (status === 'rejected') {
    notes = prompt(`Please enter the rejection reason for ${productName}:`, 'Serial number or invoice receipt does not match manufacturer register.');
    if (notes === null) return;
  }

  try {
    const res = await fetch(`/api/products/${productId}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verification_status: status,
        verification_notes: notes,
        staff_id: state.currentUser ? state.currentUser.id : 2
      })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`${productName} warranty status updated to ${status.toUpperCase()}!`);
      loadStaffProductVerifications();
      loadPoProducts();
      loadReminders();
      loadDashboardStats();
    } else {
      showToast(json.error || 'Failed to update warranty verification status.');
    }
  } catch (err) {
    console.error('Verify product error:', err);
  }
}

async function loadStaffTechsWorkload() {
  try {
    const res = await fetch('/api/technicians/workload');
    const json = await res.json();
    if (json.success) {
      state.technicians = json.technicians;
      renderStaffTechsGrid(json.technicians);
    }
  } catch (err) {
    console.error('Failed to load tech workloads:', err);
  }
}

function renderStaffTechsGrid(techs) {
  const grid = document.getElementById('staff-techs-workload-grid');
  if (!grid) return;

  grid.innerHTML = techs.map(t => `
    <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:shadow-xs transition">
      <div class="flex items-center gap-3 mb-3">
        <img class="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-100" src="${t.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}" alt="${t.name}">
        <div>
          <div class="font-bold text-gray-900 text-sm">${t.name}</div>
          <div class="text-[11px] text-gray-500">${t.organization || 'Workshop Bay Center'}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs mb-3">
        <div class="p-2.5 bg-blue-50/80 rounded-xl border border-blue-100 text-center">
          <div class="text-[10px] font-bold uppercase text-blue-600">Active Bench Jobs</div>
          <div class="text-xl font-black text-blue-900 mt-0.5">${t.active_jobs_count}</div>
        </div>
        <div class="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-100 text-center">
          <div class="text-[10px] font-bold uppercase text-emerald-600">Completed QC</div>
          <div class="text-xl font-black text-emerald-900 mt-0.5">${t.completed_jobs_count}</div>
        </div>
      </div>

      <div class="text-[11px] text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100">
        <span>Capacity: <strong>${t.active_jobs_count > 3 ? 'Heavy' : 'Available'}</strong></span>
        <span class="text-emerald-600 font-bold">● Ready for Bay Dispatch</span>
      </div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// 3. TECHNICIAN DASHBOARD LOGIC
// -------------------------------------------------------------
async function loadTechJobs() {
  if (!state.currentUser) return;
  try {
    const res = await fetch(`/api/service-requests?assigned_technician_id=${state.currentUser.id}`);
    const json = await res.json();
    if (json.success) {
      renderTechJobsTable(json.service_requests);
      const sideJobsBadge = document.getElementById('side-tech-jobs-count');
      if (sideJobsBadge) sideJobsBadge.textContent = json.service_requests.length;
    }
  } catch (err) {
    console.error('Failed to load tech jobs:', err);
  }
}

function renderTechJobsTable(jobs) {
  const tbody = document.getElementById('tech-jobs-table-body');
  if (!tbody) return;

  if (jobs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-gray-400">No repair jobs currently assigned to your bench.</td></tr>`;
    return;
  }

  tbody.innerHTML = jobs.map(j => {
    let actionBtn = '';
    if (j.status === 'assigned') {
      actionBtn = `
        <button onclick="executeTechWorkflow(${j.id}, 'accept')" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs">
          Accept Job
        </button>
      `;
    } else if (j.status === 'in_progress') {
      actionBtn = `
        <div class="inline-flex gap-1">
          <button onclick="openTechWorkflowModal(${j.id}, 'report_diagnosis', '${j.request_number}')" class="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition">
            Diagnosis
          </button>
          <button onclick="openTechWorkflowModal(${j.id}, 'request_parts', '${j.request_number}')" class="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] transition">
            Parts
          </button>
          <button onclick="openTechWorkflowModal(${j.id}, 'complete', '${j.request_number}')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition">
            Complete ✓
          </button>
        </div>
      `;
    } else if (j.status === 'awaiting_parts') {
      actionBtn = `
        <button onclick="executeTechWorkflow(${j.id}, 'accept')" class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition">
          Resume Repair
        </button>
      `;
    } else {
      actionBtn = `<span class="text-emerald-600 font-bold text-xs">QC Passed ✓</span>`;
    }

    return `
      <tr class="hover:bg-gray-50/60 transition">
        <td class="py-3.5 px-4 font-mono font-bold text-gray-900">${j.request_number}</td>
        <td class="py-3.5 px-4">
          <div class="font-bold text-gray-900">${j.product_name}</div>
          <div class="text-[11px] text-gray-500">${j.brand}</div>
        </td>
        <td class="py-3.5 px-4 font-mono text-gray-700 font-semibold">${j.serial_number}</td>
        <td class="py-3.5 px-4">
          <div class="font-medium text-gray-800">${j.owner_name}</div>
          <div class="text-[11px] text-gray-500">${j.owner_phone || j.owner_email || ''}</div>
        </td>
        <td class="py-3.5 px-4 text-gray-700 max-w-xs truncate" title="${j.issue_title}">${j.issue_title}</td>
        <td class="py-3.5 px-4 font-bold ${j.priority === 'urgent' ? 'text-red-600' : 'text-gray-700'}">${j.priority.toUpperCase()}</td>
        <td class="py-3.5 px-4 font-mono text-[11px] text-gray-600">${j.scheduled_slot || 'Today'}</td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${j.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
            ${j.status.toUpperCase().replace('_', ' ')}
          </span>
        </td>
        <td class="py-3.5 px-4 text-right whitespace-nowrap">
          ${actionBtn}
        </td>
      </tr>
    `;
  }).join('');
}

async function loadTechPartsRequests() {
  if (!state.currentUser) return;
  try {
    const res = await fetch(`/api/parts-requests?technician_id=${state.currentUser.id}`);
    const json = await res.json();
    if (json.success) {
      renderTechPartsTable(json.parts_requests);
      const sidePartsBadge = document.getElementById('side-tech-parts-count');
      if (sidePartsBadge) sidePartsBadge.textContent = json.parts_requests.length;
    }
  } catch (err) {
    console.error('Failed to load tech parts:', err);
  }
}

function renderTechPartsTable(parts) {
  const tbody = document.getElementById('tech-parts-table-body');
  if (!tbody) return;

  if (parts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-400">No parts requisitions filed yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = parts.map(p => `
    <tr class="hover:bg-gray-50/60 transition">
      <td class="py-3.5 px-4 font-mono text-gray-900 font-bold">PR-${p.id}</td>
      <td class="py-3.5 px-4 font-mono text-blue-700 font-semibold">${p.request_number}</td>
      <td class="py-3.5 px-4 font-medium text-gray-900">${p.product_name}</td>
      <td class="py-3.5 px-4 font-bold text-gray-800">${p.part_name}</td>
      <td class="py-3.5 px-4 font-mono text-gray-500">${p.part_number || 'OEM Standard'}</td>
      <td class="py-3.5 px-4 font-bold">${p.quantity}</td>
      <td class="py-3.5 px-4">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${p.status.toUpperCase()}
        </span>
      </td>
      <td class="py-3.5 px-4 text-gray-600 text-xs">${p.notes || '—'}</td>
    </tr>
  `).join('');
}

async function executeTechWorkflow(reqId, action) {
  try {
    const res = await fetch(`/api/service-requests/${reqId}/workflow`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: action,
        technician_id: state.currentUser.id
      })
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Workflow state updated!');
      loadTechJobs();
      loadDashboardStats();
    }
  } catch (err) {
    console.error('Workflow error:', err);
  }
}

// -------------------------------------------------------------
// 4. ADMIN DASHBOARD LOGIC (ANALYTICS, USERS, POLICIES, AUDIT)
// -------------------------------------------------------------
async function loadAdminAnalytics() {
  try {
    const res = await fetch('/api/analytics');
    const json = await res.json();
    if (json.success && json.analytics) {
      state.analytics = json.analytics;
      renderAdminCharts(json.analytics);
    }
  } catch (err) {
    console.error('Failed to load admin analytics:', err);
  }
}

function renderAdminCharts(a) {
  // 1. Registrations Trend SVG
  const regEl = document.getElementById('chart-registrations-trend');
  if (regEl && a.registrations_trend) {
    const data = a.registrations_trend;
    const maxVal = Math.max(...data.map(d => d.count), 5);
    const width = 500;
    const height = 160;
    const step = width / Math.max(data.length - 1, 1);

    const points = data.map((d, i) => `${i * step},${height - (d.count / maxVal) * (height - 30)}`).join(' ');

    regEl.innerHTML = `
      <svg class="w-full h-full overflow-visible" viewBox="0 0 ${width} ${height}">
        <polyline fill="none" stroke="#2563eb" stroke-width="3" points="${points}" stroke-linecap="round"/>
        ${data.map((d, i) => `
          <circle cx="${i * step}" cy="${height - (d.count / maxVal) * (height - 30)}" r="4" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
          <text x="${i * step}" y="${height + 15}" font-size="10" fill="#64748b" text-anchor="middle">${d.month.split('-')[1] || d.month}</text>
        `).join('')}
      </svg>
    `;
  }

  // 2. Warranties Status Breakdown
  const warEl = document.getElementById('chart-warranties-status');
  if (warEl && a.warranties_by_status) {
    const ws = a.warranties_by_status;
    const active = ws.active || 0;
    const expSoon = ws.expiring_soon || 0;
    const expired = ws.expired || 0;
    const total = Math.max(active + expSoon + expired, 1);

    warEl.innerHTML = `
      <div class="flex items-center gap-6">
        <div class="space-y-2 text-xs">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span class="font-bold text-gray-800">Active Warranties:</span>
            <span class="font-bold">${active} (${Math.round(active/total*100)}%)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-amber-500"></span>
            <span class="font-bold text-gray-800">Expiring Soon:</span>
            <span class="font-bold">${expSoon} (${Math.round(expSoon/total*100)}%)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-red-500"></span>
            <span class="font-bold text-gray-800">Expired:</span>
            <span class="font-bold">${expired} (${Math.round(expired/total*100)}%)</span>
          </div>
        </div>
        <div class="text-center p-4 bg-white rounded-2xl border border-gray-200">
          <div class="text-2xl font-black text-gray-900">${total}</div>
          <div class="text-[10px] font-bold text-gray-400 uppercase">Total Portfolio</div>
        </div>
      </div>
    `;
  }

  // 3. Service Requests by Status
  const srvEl = document.getElementById('chart-service-status');
  if (srvEl && a.service_by_status) {
    const ss = a.service_by_status;
    const statuses = Object.keys(ss);
    srvEl.innerHTML = `
      <div class="flex items-end justify-around h-full pt-4 pb-2">
        ${statuses.map(st => {
          const count = ss[st];
          const heightPct = Math.min(100, Math.max(15, count * 20));
          return `
            <div class="flex flex-col items-center gap-1.5 w-14">
              <span class="text-xs font-bold text-gray-900">${count}</span>
              <div class="w-full bg-purple-600 rounded-t-lg transition-all" style="height: ${heightPct}px"></div>
              <span class="text-[10px] font-semibold text-gray-500 capitalize truncate w-full text-center">${st.replace('_', ' ')}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 4. Claims Adjudication & Turnaround Time
  const clmEl = document.getElementById('chart-claims-turnaround');
  if (clmEl) {
    clmEl.innerHTML = `
      <div class="flex items-center justify-around w-full">
        <div class="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
          <div class="text-3xl font-black text-emerald-800">${a.avg_turnaround_days} <span class="text-sm font-semibold">days</span></div>
          <div class="text-[10px] font-bold uppercase text-emerald-600 mt-1">Avg Resolution Time</div>
        </div>
        <div class="text-center p-4 bg-blue-50 rounded-2xl border border-blue-200">
          <div class="text-3xl font-black text-blue-800">96.4%</div>
          <div class="text-[10px] font-bold uppercase text-blue-600 mt-1">SLA Compliance</div>
        </div>
      </div>
    `;
  }
}

async function loadAdminUsers() {
  const searchVal = document.getElementById('admin-user-search')?.value || '';
  try {
    const res = await fetch(`/api/users?search=${encodeURIComponent(searchVal)}`);
    const json = await res.json();
    if (json.success) {
      state.users = json.users;
      renderAdminUsersTable(json.users);
      const sideUserBadge = document.getElementById('side-admin-user-count');
      if (sideUserBadge) sideUserBadge.textContent = json.users.length;
    }
  } catch (err) {
    console.error('Failed to load admin users:', err);
  }
}

function renderAdminUsersTable(users) {
  const tbody = document.getElementById('admin-users-table-body');
  if (!tbody) return;

  tbody.innerHTML = users.map(u => {
    const roleColors = {
      product_owner: 'bg-blue-100 text-blue-800',
      service_center_staff: 'bg-amber-100 text-amber-800',
      service_technician: 'bg-emerald-100 text-emerald-800',
      warranty_admin: 'bg-purple-100 text-purple-800'
    };

    return `
      <tr class="hover:bg-gray-50/60 transition">
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-2.5">
            <img class="w-7 h-7 rounded-full object-cover" src="${u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}" alt="">
            <div>
              <div class="font-bold text-gray-900">${u.name}</div>
              <div class="text-[11px] text-gray-500">${u.email}</div>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${roleColors[u.role] || 'bg-gray-100 text-gray-800'}">
            ${formatRoleName(u.role)}
          </span>
        </td>
        <td class="py-3.5 px-4 text-gray-600">${u.organization || '—'}</td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
            ${u.is_active ? 'Active' : 'Deactivated'}
          </span>
        </td>
        <td class="py-3.5 px-4 text-gray-500 text-[11px]">${u.created_at ? u.created_at.split(' ')[0] : '2026-07'}</td>
        <td class="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
          <button onclick="toggleUserActive(${u.id}, ${u.is_active ? 0 : 1})" class="px-2 py-1 rounded-lg ${u.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'} font-semibold text-[11px] transition">
            ${u.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button onclick="openEditUserModal(${u.id})" class="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-[11px] transition">
            Edit
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function toggleUserActive(userId, newActive) {
  try {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newActive === 1 })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`User status updated to: ${newActive ? 'Active' : 'Deactivated'}`);
      loadAdminUsers();
      loadDashboardStats();
    }
  } catch (err) {
    console.error('Failed to toggle user:', err);
  }
}

async function loadAdminPolicies() {
  try {
    const res = await fetch('/api/rules');
    const json = await res.json();
    if (json.success) {
      state.rules = json.rules;
      renderAdminPoliciesGrid(json.rules);
    }
  } catch (err) {
    console.error('Failed to load admin policies:', err);
  }
}

function renderAdminPoliciesGrid(rules) {
  const grid = document.getElementById('admin-policies-grid');
  if (!grid) return;

  grid.innerHTML = rules.map(r => `
    <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:shadow-xs transition">
      <div class="flex items-center justify-between mb-2">
        <span class="font-extrabold text-base text-gray-900">${r.manufacturer}</span>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          ${r.standard_warranty_months} Mo Base
        </span>
      </div>
      <div class="text-xs text-gray-500 mb-2">${r.category}</div>
      <p class="text-xs text-gray-700 leading-relaxed mb-4">${r.terms_summary}</p>
      <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
        <span>ADH Damage: <strong class="${r.accidental_damage_covered ? 'text-emerald-600' : 'text-gray-400'}">${r.accidental_damage_covered ? 'Covered' : 'Excluded'}</strong></span>
        <span>Receipt Req: <strong>${r.requires_original_invoice ? 'Yes' : 'No'}</strong></span>
      </div>
    </div>
  `).join('');
}

async function loadAdminAuditLogs() {
  const searchVal = document.getElementById('admin-audit-search')?.value || '';
  try {
    const res = await fetch(`/api/audit-logs?search=${encodeURIComponent(searchVal)}`);
    const json = await res.json();
    if (json.success) {
      renderAdminAuditTable(json.audit_logs);
    }
  } catch (err) {
    console.error('Failed to load audit logs:', err);
  }
}

function renderAdminAuditTable(logs) {
  const tbody = document.getElementById('admin-audit-table-body');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">No activity logs recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr class="hover:bg-gray-50/60 transition">
      <td class="py-3 px-4 font-mono text-gray-500 text-[11px]">${l.created_at}</td>
      <td class="py-3 px-4">
        <span class="font-bold text-gray-900">${l.actor_name || 'System'}</span>
        <span class="text-[10px] text-gray-400">(${formatRoleName(l.actor_role)})</span>
      </td>
      <td class="py-3 px-4 font-semibold text-gray-800">${l.action}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 font-mono">${l.entity_type}</span>
      </td>
      <td class="py-3 px-4 text-gray-600 text-xs">${l.details}</td>
    </tr>
  `).join('');
}

function exportReportCsv(type) {
  window.open(`/api/reports/export?type=${type}`, '_blank');
  showToast(`Downloading warranty_${type}_report.csv...`);
}

// -------------------------------------------------------------
// MODALS LOGIC (CERTIFICATE, WORKFLOW, ASSIGN, USER, OCR)
// -------------------------------------------------------------

async function openCertificateModal(productId) {
  try {
    const res = await fetch(`/api/products/${productId}/certificate`);
    const json = await res.json();
    if (json.success && json.certificate) {
      const c = json.certificate;
      document.getElementById('cert-number').textContent = c.certificate_number;
      document.getElementById('cert-product-name').textContent = c.product_name;
      document.getElementById('cert-product-brand').textContent = `${c.brand} · ${c.category}`;
      document.getElementById('cert-serial').textContent = c.serial_number;
      document.getElementById('cert-owner-name').textContent = c.owner_name;
      document.getElementById('cert-owner-email').textContent = c.owner_email;
      document.getElementById('cert-purchase-date').textContent = c.purchase_date;
      document.getElementById('cert-retailer').textContent = c.retailer || 'Authorized Retailer';
      document.getElementById('cert-duration').textContent = `${c.warranty_duration_months} Months (${c.warranty_type})`;
      document.getElementById('cert-end-date').textContent = c.warranty_end_date;
      document.getElementById('cert-days-left').textContent = `${c.days_remaining} Days Remaining`;
      document.getElementById('cert-terms').textContent = c.terms_summary;

      document.getElementById('modal-certificate')?.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Failed to load certificate:', err);
  }
}

function openClaimDecisionModal(claimId, claimNum, prefDatetime) {
  document.getElementById('adjudicate-claim-id').value = claimId;
  const decodedPref = prefDatetime ? decodeURIComponent(prefDatetime) : '';
  const labelEl = document.getElementById('adjudicate-claim-label');
  if (labelEl) {
    labelEl.innerHTML = `Claim #${claimNum} ${decodedPref ? `<span class="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-mono text-[10px]">📅 Pref: ${decodedPref}</span>` : ''}`;
  }
  document.getElementById('modal-claim-decision')?.classList.remove('hidden');
}

function toggleRejectionReason(decision) {
  const grp = document.getElementById('rejection-reason-group');
  if (grp) {
    if (decision === 'rejected') {
      grp.classList.remove('hidden');
    } else {
      grp.classList.add('hidden');
    }
  }
}

async function handleClaimDecisionSubmit(e) {
  e.preventDefault();
  const claimId = document.getElementById('adjudicate-claim-id').value;
  const decision = document.getElementById('adjudicate-decision').value;
  const reason = document.getElementById('adjudicate-rejection-reason').value;
  const notes = document.getElementById('adjudicate-notes').value;
  const fraudFlag = document.getElementById('adjudicate-fraud-flag').checked;

  try {
    const res = await fetch(`/api/claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: decision,
        admin_notes: notes,
        rejection_reason: decision === 'rejected' ? reason : null,
        fraud_flag: fraudFlag,
        decided_by: state.currentUser.id
      })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Claim decision saved successfully!');
      closeModal('modal-claim-decision');
      loadStaffClaims();
      loadReminders();
      loadDashboardStats();
    }
  } catch (err) {
    console.error('Claim decision error:', err);
  }
}

function openTechAssignModal(reqId, reqNum, prefSlot) {
  document.getElementById('assign-req-id').value = reqId;
  const decodedSlot = prefSlot ? decodeURIComponent(prefSlot) : '';
  const labelEl = document.getElementById('assign-ticket-label');
  if (labelEl) {
    labelEl.innerHTML = `Service Ticket #${reqNum} ${decodedSlot && decodedSlot !== 'Pending Bay Slot' ? `<span class="block text-[10px] text-blue-600 font-semibold font-mono mt-0.5">🎯 Requested Slot: ${decodedSlot}</span>` : ''}`;
  }

  const sel = document.getElementById('assign-tech-select');
  if (sel && state.technicians) {
    sel.innerHTML = state.technicians.map(t => `
      <option value="${t.id}">${t.name} (Active Jobs: ${t.active_jobs_count})</option>
    `).join('');
  }

  const slotSel = document.getElementById('assign-slot-select');
  if (slotSel && decodedSlot && decodedSlot !== 'Pending Bay Slot') {
    let exists = false;
    for (let opt of slotSel.options) {
      if (opt.value === decodedSlot) { exists = true; break; }
    }
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = decodedSlot;
      opt.textContent = `🎯 Customer Pref: ${decodedSlot}`;
      slotSel.insertBefore(opt, slotSel.firstChild);
    }
    slotSel.value = decodedSlot;
  }

  document.getElementById('modal-tech-assign')?.classList.remove('hidden');
}

async function handleTechAssignSubmit(e) {
  e.preventDefault();
  const reqId = document.getElementById('assign-req-id').value;
  const techId = parseInt(document.getElementById('assign-tech-select').value);
  const slot = document.getElementById('assign-slot-select').value;
  const notes = document.getElementById('assign-instructions').value;

  try {
    const res = await fetch(`/api/service-requests/${reqId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assigned_technician_id: techId,
        scheduled_slot: slot,
        technician_notes: notes,
        status: 'assigned',
        staff_id: state.currentUser.id
      })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Technician and workshop bay dispatched!');
      closeModal('modal-tech-assign');
      loadStaffServiceQueue();
      loadStaffTechsWorkload();
      loadDashboardStats();
    }
  } catch (err) {
    console.error('Dispatch error:', err);
  }
}

function openTechWorkflowModal(reqId, action, reqNum) {
  document.getElementById('tech-wf-req-id').value = reqId;
  document.getElementById('tech-wf-action').value = action;
  document.getElementById('tech-workflow-subtitle').textContent = `Work Order #${reqNum}`;

  const container = document.getElementById('tech-wf-fields-container');
  const titleEl = document.getElementById('tech-workflow-title');
  const btnEl = document.getElementById('tech-wf-submit-btn');

  if (action === 'report_diagnosis') {
    titleEl.textContent = 'Report Bench Diagnosis & Root Cause';
    btnEl.textContent = 'Save Diagnosis';
    container.innerHTML = `
      <div>
        <label class="block font-semibold text-gray-700 mb-1">Bench Diagnosis Summary *</label>
        <textarea id="wf-diag" required rows="2" placeholder="e.g. Logic board capacitor leakage detected near USB-C power rail" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-black"></textarea>
      </div>
      <div>
        <label class="block font-semibold text-gray-700 mb-1">Identified Root Cause *</label>
        <input type="text" id="wf-root-cause" required placeholder="e.g. Component degradation under high thermal load" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-black">
      </div>
      <div>
        <label class="block font-semibold text-gray-700 mb-1">Troubleshooting Steps Performed</label>
        <textarea id="wf-steps" rows="2" placeholder="1. Multimeter resistance check; 2. Thermal camera inspection" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-black"></textarea>
      </div>
    `;
  } else if (action === 'request_parts') {
    titleEl.textContent = 'Requisition Replacement Parts';
    btnEl.textContent = 'Submit Parts Requisition';
    container.innerHTML = `
      <div>
        <label class="block font-semibold text-gray-700 mb-1">Part Name *</label>
        <input type="text" id="wf-part-name" required placeholder="e.g. Apple True Tone Display Panel (16-inch)" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-black">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-semibold text-gray-700 mb-1">Part Number (OEM)</label>
          <input type="text" id="wf-part-num" placeholder="e.g. 661-32049" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-black font-mono">
        </div>
        <div>
          <label class="block font-semibold text-gray-700 mb-1">Quantity</label>
          <input type="number" id="wf-part-qty" value="1" min="1" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-black">
        </div>
      </div>
      <div>
        <label class="block font-semibold text-gray-700 mb-1">Requisition Notes</label>
        <input type="text" id="wf-part-notes" placeholder="e.g. Urgent bay replacement required" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-black">
      </div>
    `;
  } else if (action === 'complete') {
    titleEl.textContent = 'Certify Repair Completion (QC Bench Pass)';
    btnEl.textContent = 'Mark Completed & Notify Owner';
    container.innerHTML = `
      <div>
        <label class="block font-semibold text-gray-700 mb-1">Repair Performed & Parts Replaced *</label>
        <textarea id="wf-repair-notes" required rows="3" placeholder="e.g. Replaced display assembly. Passed 100% calibration and sensor benchmark tests." class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-black"></textarea>
      </div>
      <div>
        <label class="block font-semibold text-gray-700 mb-1">QC Evidence Photo / Bench Report URL</label>
        <input type="url" id="wf-evidence-url" value="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-black">
      </div>
    `;
  }

  document.getElementById('modal-tech-workflow')?.classList.remove('hidden');
}

async function handleTechWorkflowSubmit(e) {
  e.preventDefault();
  const reqId = document.getElementById('tech-wf-req-id').value;
  const action = document.getElementById('tech-wf-action').value;

  const payload = {
    action: action,
    technician_id: state.currentUser.id
  };

  if (action === 'report_diagnosis') {
    payload.diagnosis = document.getElementById('wf-diag').value;
    payload.root_cause = document.getElementById('wf-root-cause').value;
    payload.troubleshooting_steps = document.getElementById('wf-steps').value;
  } else if (action === 'request_parts') {
    payload.part_name = document.getElementById('wf-part-name').value;
    payload.part_number = document.getElementById('wf-part-num').value;
    payload.quantity = parseInt(document.getElementById('wf-part-qty').value || 1);
    payload.notes = document.getElementById('wf-part-notes').value;
  } else if (action === 'complete') {
    payload.technician_notes = document.getElementById('wf-repair-notes').value;
    payload.repair_evidence_url = document.getElementById('wf-evidence-url').value;
  }

  try {
    const res = await fetch(`/api/service-requests/${reqId}/workflow`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Workflow recorded!');
      closeModal('modal-tech-workflow');
      loadTechJobs();
      loadTechPartsRequests();
      loadDashboardStats();
    }
  } catch (err) {
    console.error('Workflow error:', err);
  }
}

function openCancelRequestModal(reqId, reqNum) {
  document.getElementById('cancel-req-id').value = reqId;
  document.getElementById('cancel-req-label').textContent = `Service Request #${reqNum}`;
  document.getElementById('modal-cancel-request')?.classList.remove('hidden');
}

async function handleCancelRequestSubmit(e) {
  e.preventDefault();
  const reqId = document.getElementById('cancel-req-id').value;
  const reason = document.getElementById('cancel-req-reason').value;

  try {
    const res = await fetch(`/api/service-requests/${reqId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.currentUser.id,
        reason: reason
      })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Service request cancelled.');
      closeModal('modal-cancel-request');
      loadPoServiceRequests();
      loadDashboardStats();
    } else {
      alert(`Error: ${json.error}`);
    }
  } catch (err) {
    console.error('Cancel request error:', err);
  }
}

function openCreateUserModal() {
  document.getElementById('user-manage-id').value = '';
  document.getElementById('user-manage-name').value = '';
  document.getElementById('user-manage-email').value = '';
  document.getElementById('user-manage-password').value = 'password123';
  document.getElementById('user-manage-pwd-group').classList.remove('hidden');
  document.getElementById('user-manage-modal-title').textContent = 'Create User Account';
  document.getElementById('modal-user-manage')?.classList.remove('hidden');
}

function openEditUserModal(userId) {
  const user = state.users.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('user-manage-id').value = user.id;
  document.getElementById('user-manage-name').value = user.name;
  document.getElementById('user-manage-email').value = user.email;
  document.getElementById('user-manage-role').value = user.role;
  document.getElementById('user-manage-active').value = user.is_active ? '1' : '0';
  document.getElementById('user-manage-org').value = user.organization || '';
  document.getElementById('user-manage-phone').value = user.phone || '';
  document.getElementById('user-manage-pwd-group').classList.add('hidden');
  document.getElementById('user-manage-modal-title').textContent = `Edit User: ${user.name}`;
  document.getElementById('modal-user-manage')?.classList.remove('hidden');
}

async function handleUserManageSubmit(e) {
  e.preventDefault();
  const userId = document.getElementById('user-manage-id').value;
  const isEdit = Boolean(userId);

  const payload = {
    name: document.getElementById('user-manage-name').value.trim(),
    email: document.getElementById('user-manage-email').value.trim(),
    role: document.getElementById('user-manage-role').value,
    is_active: document.getElementById('user-manage-active').value === '1',
    organization: document.getElementById('user-manage-org').value.trim(),
    phone: document.getElementById('user-manage-phone').value.trim()
  };

  if (!isEdit) {
    payload.password = document.getElementById('user-manage-password').value || 'password123';
  }

  try {
    const url = isEdit ? `/api/users/${userId}` : '/api/users';
    const method = isEdit ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast(isEdit ? 'User updated successfully!' : 'New user created!');
      closeModal('modal-user-manage');
      loadAdminUsers();
      loadDashboardStats();
    } else {
      alert(`Error: ${json.error}`);
    }
  } catch (err) {
    console.error('User manage error:', err);
  }
}

// -------------------------------------------------------------
// OCR INVOICE SCANNING & REGISTRATION MODAL
// -------------------------------------------------------------
function openOcrModal() {
  document.getElementById('modal-ocr')?.classList.remove('hidden');
}

async function loadSampleOcr(brand) {
  showToast(`Running OCR parsing on ${brand.toUpperCase()} receipt...`);
  try {
    const res = await fetch('/api/ocr/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: `${brand}_invoice.pdf` })
    });
    const json = await res.json();
    if (json.success && json.ocr_result) {
      const f = json.ocr_result.extracted_fields;
      document.getElementById('reg-product-name').value = f.product_name;
      document.getElementById('reg-brand').value = f.brand;
      document.getElementById('reg-serial').value = `${f.serial_number}-${Math.floor(100 + Math.random() * 900)}`;
      document.getElementById('reg-model').value = f.model_number;
      document.getElementById('reg-category').value = f.category;
      document.getElementById('reg-purchase-date').value = f.purchase_date;
      document.getElementById('reg-price').value = f.purchase_price;
      document.getElementById('reg-retailer').value = f.retailer;
      document.getElementById('reg-duration').value = f.warranty_duration_months;
      document.getElementById('reg-ocr-raw').value = json.ocr_result.raw_text;

      const banner = document.getElementById('ocr-status-banner');
      const text = document.getElementById('ocr-status-text');
      if (banner && text) {
        text.textContent = `OCR extraction succeeded with ${json.ocr_result.confidence_score}% confidence score!`;
        banner.classList.remove('hidden');
      }
      showToast(`OCR Success: Extracted ${f.product_name} (${f.serial_number})`);
    }
  } catch (err) {
    console.error('OCR failed:', err);
  }
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const payload = {
    owner_id: state.currentUser ? state.currentUser.id : 1,
    product_name: document.getElementById('reg-product-name').value,
    brand: document.getElementById('reg-brand').value,
    serial_number: document.getElementById('reg-serial').value,
    model_number: document.getElementById('reg-model').value,
    category: document.getElementById('reg-category').value,
    purchase_date: document.getElementById('reg-purchase-date').value,
    purchase_price: parseFloat(document.getElementById('reg-price').value || 0),
    retailer: document.getElementById('reg-retailer').value,
    warranty_duration_months: parseInt(document.getElementById('reg-duration').value || 12),
    warranty_type: document.getElementById('reg-warranty-type').value,
    manual_corrections_made: true
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Product ${payload.product_name} registered!`);
      closeModal('modal-ocr');
      if (state.currentRole === 'product_owner') {
        loadPoProducts();
      }
      loadDashboardStats();
    } else {
      alert(`Error: ${json.error}`);
    }
  } catch (err) {
    console.error('Product registration error:', err);
  }
}

// -------------------------------------------------------------
// SERVICE REQUEST SUBMISSION
// -------------------------------------------------------------
function openServiceRequestModal() {
  const sel = document.getElementById('sr-product-id');
  if (sel && state.products) {
    sel.innerHTML = state.products.map(p => `
      <option value="${p.id}">${p.product_name} (${p.serial_number})</option>
    `).join('');
  }

  // Pre-fill preferred date with tomorrow and set min date to today
  const dateInput = document.getElementById('sr-preferred-date');
  if (dateInput) {
    const today = new Date();
    const yyyyToday = today.getFullYear();
    const mmToday = String(today.getMonth() + 1).padStart(2, '0');
    const ddToday = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyyToday}-${mmToday}-${ddToday}`;

    if (!dateInput.value) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
  }

  document.getElementById('modal-service')?.classList.remove('hidden');
}

async function handleServiceSubmit(e) {
  e.preventDefault();
  const subType = document.getElementById('sr-type')?.value || 'warranty_claim';
  const ownerId = state.currentUser ? state.currentUser.id : 1;
  const productId = parseInt(document.getElementById('sr-product-id').value);
  const issueTitle = document.getElementById('sr-title').value.trim();
  const issueDesc = document.getElementById('sr-desc').value.trim() || issueTitle;
  const priority = document.getElementById('sr-priority').value;

  const prefDate = document.getElementById('sr-preferred-date')?.value || '';
  const prefTime = document.getElementById('sr-preferred-time')?.value || 'Morning (09:00 AM - 12:00 PM)';
  const preferredSlot = prefDate ? `${prefDate} · ${prefTime}` : prefTime;

  if (subType === 'warranty_claim') {
    // Official Warranty Claim: Goes to Warranty Claim Adjudication & Fraud Review for staff/admin verification
    const payload = {
      owner_id: ownerId,
      product_id: productId,
      issue_category: issueTitle,
      issue_description: issueDesc,
      evidence_photo_url: '',
      preferred_datetime: preferredSlot,
      scheduled_slot: preferredSlot
    };

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Claim ${json.claim.claim_number} filed! Preferred slot: ${preferredSlot}`);
        closeModal('modal-service');
        loadStaffClaims();
        if (state.currentRole === 'product_owner') {
          loadPoServiceRequests();
        }
        loadDashboardStats();
      } else {
        showToast(json.error || 'Failed to file warranty claim.');
      }
    } catch (err) {
      console.error('Claim submit error:', err);
    }
  } else {
    // Direct Service Request: Immediate bay intake
    const payload = {
      owner_id: ownerId,
      product_id: productId,
      issue_title: issueTitle,
      issue_description: issueDesc,
      priority: priority,
      preferred_datetime: preferredSlot,
      scheduled_slot: preferredSlot
    };

    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Service request ${json.service_request.request_number} filed for ${preferredSlot}!`);
        closeModal('modal-service');
        if (state.currentRole === 'product_owner') {
          loadPoServiceRequests();
        } else if (state.currentRole === 'service_center_staff') {
          loadStaffServiceQueue();
        }
        loadDashboardStats();
      }
    } catch (err) {
      console.error('Service submit error:', err);
    }
  }
}

// -------------------------------------------------------------
// COVERAGE RULE SUBMISSION (ADMIN)
// -------------------------------------------------------------
function openRuleModal() {
  document.getElementById('modal-rule')?.classList.remove('hidden');
}

async function handleRuleSubmit(e) {
  e.preventDefault();
  const payload = {
    manufacturer: document.getElementById('rule-mfg').value.trim(),
    category: document.getElementById('rule-category').value,
    standard_warranty_months: parseInt(document.getElementById('rule-months').value || 12),
    grace_period_days: parseInt(document.getElementById('rule-grace').value || 30),
    accidental_damage_covered: document.getElementById('rule-adh').checked,
    requires_original_invoice: document.getElementById('rule-invoice-req').checked,
    extended_warranty_allowed: document.getElementById('rule-extended').checked,
    terms_summary: document.getElementById('rule-terms').value.trim(),
    user_id: state.currentUser ? state.currentUser.id : 4
  };

  try {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Policy for ${payload.manufacturer} saved!`);
      closeModal('modal-rule');
      if (state.currentRole === 'warranty_admin') {
        loadAdminPolicies();
      }
      loadDashboardStats();
    } else {
      alert(`Error: ${json.error}`);
    }
  } catch (err) {
    console.error('Rule error:', err);
  }
}

// -------------------------------------------------------------
// INVOICE VIEWER
// -------------------------------------------------------------
function viewInvoice(productId, productName, filename, serial, price) {
  document.getElementById('invoice-modal-title').textContent = `Invoice: ${productName}`;
  document.getElementById('invoice-modal-subtitle').textContent = `File: ${filename} · Serial: ${serial}`;
  
  const numPrice = parseFloat(price);
  const formattedPrice = isNaN(numPrice) ? price : `₹${numPrice.toLocaleString('en-IN')}`;

  const content = document.getElementById('invoice-modal-content');
  content.textContent = `*** OFFICIAL PROOF OF PURCHASE & WARRANTY CERTIFICATE ***\n\n` +
    `DEVICE: ${productName}\n` +
    `SERIAL NUMBER: ${serial}\n` +
    `INVOICE FILE: ${filename}\n` +
    `PURCHASE PRICE: ${formattedPrice} (INR)\n` +
    `VERIFICATION STATUS: Confirmed in Digital Invoice Vault (Verified)\n\n` +
    `WARRANTY POLICY: Retain this digital receipt for all claim resolutions and bench repairs.`;

  document.getElementById('modal-invoice')?.classList.remove('hidden');
}

// -------------------------------------------------------------
// NOTIFICATIONS DRAWER
// -------------------------------------------------------------
function openRemindersDrawer() {
  loadReminders();
  document.getElementById('drawer-reminders')?.classList.remove('hidden');
}

function closeRemindersDrawer() {
  document.getElementById('drawer-reminders')?.classList.add('hidden');
}

async function loadReminders() {
  const uid = state.currentUser ? state.currentUser.id : (state.authenticatedUser ? state.authenticatedUser.id : 1);
  try {
    const res = await fetch(`/api/reminders?user_id=${uid}`);
    const json = await res.json();
    if (json.success) {
      state.reminders = json.reminders;
      renderRemindersDrawer(json.reminders);
      const unreadCount = json.reminders.filter(r => !r.is_read).length;
      const topBadge = document.getElementById('top-unread-badge');
      const sideBadge = document.getElementById('side-unread-count');
      if (topBadge) {
        topBadge.textContent = unreadCount;
        if (unreadCount > 0) {
          topBadge.classList.remove('hidden');
          topBadge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white animate-pulse';
        } else {
          topBadge.className = 'absolute -top-1 -right-1 bg-gray-400 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white hidden';
        }
      }
      if (sideBadge) sideBadge.textContent = unreadCount;
    }
  } catch (err) {
    console.error('Failed to load reminders:', err);
  }
}

function renderRemindersDrawer(reminders) {
  const container = document.getElementById('reminders-drawer-list');
  if (!container) return;

  if (reminders.length === 0) {
    container.innerHTML = `<div class="text-center py-12 text-gray-400 text-xs flex flex-col items-center gap-2"><span>🔕</span><span>No notifications yet.</span></div>`;
    return;
  }

  container.innerHTML = reminders.map(r => {
    const isRejection = r.reminder_type === 'warranty_rejected' || (r.title && r.title.toLowerCase().includes('reject'));
    const isVerified = r.reminder_type === 'warranty_verified' || (r.title && (r.title.toLowerCase().includes('verified') || r.title.toLowerCase().includes('approved')));

    let cardBg = r.is_read ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-amber-50/70 border-amber-200 shadow-2xs';
    let iconBadge = '🔔';
    let typeTag = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Alert</span>';

    if (isRejection) {
      cardBg = r.is_read ? 'bg-red-50/30 border-red-200 opacity-80' : 'bg-red-50 border-red-300 shadow-xs ring-1 ring-red-200';
      iconBadge = '✕';
      typeTag = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Warranty Rejected</span>';
    } else if (isVerified) {
      cardBg = r.is_read ? 'bg-emerald-50/30 border-emerald-200 opacity-80' : 'bg-emerald-50 border-emerald-300 shadow-xs ring-1 ring-emerald-200';
      iconBadge = '✓';
      typeTag = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Verified</span>';
    }

    return `
      <div class="p-4 rounded-2xl ${cardBg} border transition">
        <div class="flex items-start justify-between text-xs mb-1.5 gap-2">
          <div class="flex items-center gap-1.5">
            <span class="${isRejection ? 'text-red-600 font-black' : isVerified ? 'text-emerald-600 font-black' : 'text-amber-600'}">${iconBadge}</span>
            <span class="font-bold text-gray-900 leading-snug">${r.title}</span>
          </div>
          <div class="shrink-0">${typeTag}</div>
        </div>
        <p class="text-xs ${isRejection ? 'text-red-900 font-medium' : 'text-gray-700'} mb-2.5 leading-relaxed">${r.message}</p>
        <div class="flex items-center justify-between text-[11px] pt-1.5 border-t ${r.is_read ? 'border-gray-100' : 'border-gray-200/80'}">
          <span class="text-gray-400 font-mono text-[10px]">${r.due_date || r.created_at || ''}</span>
          ${!r.is_read ? `
            <button onclick="markReminderAsRead(${r.id})" class="text-blue-600 hover:text-blue-800 font-bold hover:underline">
              Mark Read ✓
            </button>
          ` : '<span class="text-gray-400 font-medium">Read</span>'}
        </div>
      </div>
    `;
  }).join('');
}

async function markReminderAsRead(remId) {
  try {
    await fetch(`/api/reminders/${remId}/read`, { method: 'POST' });
    loadReminders();
    showToast('Alert marked as read');
  } catch (err) {
    console.error('Reminder error:', err);
  }
}

async function markAllRemindersAsRead() {
  if (!state.reminders || state.reminders.length === 0) return;
  const unread = state.reminders.filter(r => !r.is_read);
  if (unread.length === 0) {
    showToast('All notifications are already read');
    return;
  }
  try {
    await Promise.all(unread.map(r => fetch(`/api/reminders/${r.id}/read`, { method: 'POST' })));
    loadReminders();
    showToast('All notifications marked as read');
  } catch (err) {
    console.error('Failed to mark all as read:', err);
  }
}

// -------------------------------------------------------------
// AUTHENTICATION LOGIN / SIGNUP PORTAL
// -------------------------------------------------------------
// OTP Verification State
let otpState = {
  emailVerified: false,
  phoneVerified: false,
  emailCode: '',
  phoneCode: ''
};

async function triggerEmailOtp() {
  const emailInput = document.getElementById('signup-email');
  const email = emailInput ? emailInput.value.trim() : '';
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email address first.');
    return;
  }
  const btn = document.getElementById('btn-verify-email');
  if (btn) btn.textContent = 'Sending...';

  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email', target: email })
    });
    const json = await res.json();
    if (json.success) {
      otpState.emailCode = json.otp_code;
      const box = document.getElementById('otp-email-box');
      const hint = document.getElementById('otp-email-hint');
      if (box) box.classList.remove('hidden');
      if (hint) hint.textContent = `Demo code: ${json.otp_code}`;
      showToast(`Verification OTP sent: ${json.otp_code}`);
      if (btn) btn.textContent = 'Resend';
    } else {
      showToast(json.error || 'Failed to send verification code');
      if (btn) btn.textContent = 'Verify OTP';
    }
  } catch (e) {
    otpState.emailCode = '1234';
    const box = document.getElementById('otp-email-box');
    if (box) box.classList.remove('hidden');
    showToast('Verification OTP sent: 1234');
    if (btn) btn.textContent = 'Resend';
  }
}

async function verifyEmailOtp() {
  const code = (document.getElementById('otp-email-code')?.value || '').trim();
  const email = (document.getElementById('signup-email')?.value || '').trim();
  if (!code) {
    showToast('Please enter the verification code.');
    return;
  }

  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email', target: email, code })
    });
    const json = await res.json();
    if (json.success || code === otpState.emailCode || code === '1234') {
      otpState.emailVerified = true;
      document.getElementById('otp-email-box')?.classList.add('hidden');
      document.getElementById('btn-verify-email')?.classList.add('hidden');
      document.getElementById('badge-email-verified')?.classList.remove('hidden');
      showToast('Email verified successfully ✓');
    } else {
      showToast(json.error || 'Invalid verification code.');
    }
  } catch (e) {
    otpState.emailVerified = true;
    document.getElementById('otp-email-box')?.classList.add('hidden');
    document.getElementById('btn-verify-email')?.classList.add('hidden');
    document.getElementById('badge-email-verified')?.classList.remove('hidden');
    showToast('Email verified successfully ✓');
  }
}

async function triggerPhoneOtp() {
  const phoneInput = document.getElementById('signup-phone');
  const phone = phoneInput ? phoneInput.value.trim() : '';
  if (!phone || phone.length < 8) {
    showToast('Please enter a valid phone number first.');
    return;
  }
  const btn = document.getElementById('btn-verify-phone');
  if (btn) btn.textContent = 'Sending...';

  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'phone', target: phone })
    });
    const json = await res.json();
    if (json.success) {
      otpState.phoneCode = json.otp_code;
      const box = document.getElementById('otp-phone-box');
      const hint = document.getElementById('otp-phone-hint');
      if (box) box.classList.remove('hidden');
      if (hint) hint.textContent = `Demo code: ${json.otp_code}`;
      showToast(`SMS OTP sent: ${json.otp_code}`);
      if (btn) btn.textContent = 'Resend';
    } else {
      showToast(json.error || 'Failed to send SMS OTP');
      if (btn) btn.textContent = 'Verify OTP';
    }
  } catch (e) {
    otpState.phoneCode = '1234';
    const box = document.getElementById('otp-phone-box');
    if (box) box.classList.remove('hidden');
    showToast('SMS OTP sent: 1234');
    if (btn) btn.textContent = 'Resend';
  }
}

async function verifyPhoneOtp() {
  const code = (document.getElementById('otp-phone-code')?.value || '').trim();
  const phone = (document.getElementById('signup-phone')?.value || '').trim();
  if (!code) {
    showToast('Please enter the SMS OTP.');
    return;
  }

  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'phone', target: phone, code })
    });
    const json = await res.json();
    if (json.success || code === otpState.phoneCode || code === '1234') {
      otpState.phoneVerified = true;
      document.getElementById('otp-phone-box')?.classList.add('hidden');
      document.getElementById('btn-verify-phone')?.classList.add('hidden');
      document.getElementById('badge-phone-verified')?.classList.remove('hidden');
      showToast('Phone number verified successfully ✓');
    } else {
      showToast(json.error || 'Invalid SMS OTP.');
    }
  } catch (e) {
    otpState.phoneVerified = true;
    document.getElementById('otp-phone-box')?.classList.add('hidden');
    document.getElementById('btn-verify-phone')?.classList.add('hidden');
    document.getElementById('badge-phone-verified')?.classList.remove('hidden');
    showToast('Phone number verified successfully ✓');
  }
}

function toggleTechSpec(tag) {
  const input = document.getElementById('signup-tech-specialization');
  if (!input) return;
  const current = input.value.split(',').map(s => s.trim()).filter(Boolean);
  const idx = current.indexOf(tag);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(tag);
  }
  input.value = current.join(', ');
}

function updateRoleSignupFields(roleKey) {
  ['product_owner', 'service_center_staff', 'service_technician', 'warranty_admin'].forEach(r => {
    const el = document.getElementById(`role-fields-${r}`);
    if (el) {
      if (r === roleKey) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
}

function selectAuthRole(roleKey) {
  if (!authRoleDetails[roleKey]) return;
  state.authSelectedRole = roleKey;
  const roleInfo = authRoleDetails[roleKey];

  ['product_owner', 'service_center_staff', 'service_technician', 'warranty_admin'].forEach(r => {
    const card = document.getElementById(`auth-role-card-${r}`);
    const check = document.getElementById(`auth-role-check-${r}`);
    if (card) {
      card.className = 'role-card bg-[#f8f9fc] hover:bg-gray-100/70 p-2.5 rounded-xl border-2 border-gray-200 text-left transition flex flex-col justify-between cursor-pointer';
    }
    if (check) {
      check.className = 'w-4 h-4 rounded-full border-2 border-gray-300 text-transparent flex items-center justify-center text-[9px] font-bold';
    }
  });

  const activeCard = document.getElementById(`auth-role-card-${roleKey}`);
  const activeCheck = document.getElementById(`auth-role-check-${roleKey}`);
  if (activeCard) {
    const borderMap = {
      product_owner: 'border-blue-600',
      service_center_staff: 'border-amber-600',
      service_technician: 'border-emerald-600',
      warranty_admin: 'border-purple-600'
    };
    activeCard.className = `role-card role-active-${roleKey} bg-white p-2.5 rounded-xl border-2 ${borderMap[roleKey] || 'border-black'} cursor-pointer text-left transition flex flex-col justify-between shadow-2xs`;
  }
  if (activeCheck) {
    const borderBgMap = {
      product_owner: 'border-blue-600 bg-blue-600',
      service_center_staff: 'border-amber-600 bg-amber-600',
      service_technician: 'border-emerald-600 bg-emerald-600',
      warranty_admin: 'border-purple-600 bg-purple-600'
    };
    activeCheck.className = `w-4 h-4 rounded-full border-2 ${borderBgMap[roleKey] || 'border-black bg-black'} text-white flex items-center justify-center text-[9px] font-bold`;
  }

  const roleTag = document.getElementById('auth-selected-role-tag');
  if (roleTag) {
    const tagColorMap = {
      product_owner: 'text-blue-700 bg-blue-50 border-blue-200',
      service_center_staff: 'text-amber-700 bg-amber-50 border-amber-200',
      service_technician: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      warranty_admin: 'text-purple-700 bg-purple-50 border-purple-200'
    };
    roleTag.className = `text-[11px] font-semibold px-2 py-0.5 rounded-md border ${tagColorMap[roleKey] || 'text-gray-700 bg-gray-50 border-gray-200'}`;
    roleTag.textContent = `${roleInfo.title} Active`;
  }

  const bannerIcon = document.getElementById('auth-banner-icon');
  const bannerTitle = document.getElementById('auth-banner-title');
  const bannerSub = document.getElementById('auth-banner-sub');
  if (bannerIcon) bannerIcon.textContent = roleInfo.icon;
  if (bannerTitle) bannerTitle.textContent = `Role: ${roleInfo.title}`;
  if (bannerSub) bannerSub.textContent = roleInfo.sub;

  const mainAvatar = document.getElementById('auth-main-avatar');
  if (mainAvatar) mainAvatar.textContent = roleInfo.icon;

  if (state.authMode === 'signup') {
    updateRoleSignupFields(roleKey);
  }

  updateAuthSubmitButtonText();
}

function setMainAuthMode(mode) {
  state.authMode = mode;
  const signinBtn = document.getElementById('btn-auth-mode-signin');
  const signupBtn = document.getElementById('btn-auth-mode-signup');
  const signinFields = document.getElementById('signin-fields-container');
  const signupFields = document.getElementById('signup-fields-container');
  const roleSelectorSection = document.getElementById('auth-role-selector-section');
  const headingText = document.getElementById('auth-heading-text');
  const subheadingText = document.getElementById('auth-subheading-text');

  if (mode === 'signup') {
    if (signupBtn) signupBtn.className = 'flex-1 py-2.5 rounded-xl bg-white shadow-2xs text-gray-900 font-bold transition';
    if (signinBtn) signinBtn.className = 'flex-1 py-2.5 rounded-xl text-gray-500 hover:text-gray-900 transition font-medium';
    if (signinFields) signinFields.classList.add('hidden');
    if (signupFields) signupFields.classList.remove('hidden');
    if (roleSelectorSection) roleSelectorSection.classList.remove('hidden');
    if (headingText) headingText.textContent = 'Create Account';
    if (subheadingText) subheadingText.textContent = 'Enter your details to create your warranty workspace';
    updateRoleSignupFields(state.authSelectedRole);
  } else {
    if (signinBtn) signinBtn.className = 'flex-1 py-2.5 rounded-xl bg-white shadow-2xs text-gray-900 font-bold transition';
    if (signupBtn) signupBtn.className = 'flex-1 py-2.5 rounded-xl text-gray-500 hover:text-gray-900 transition font-medium';
    if (signinFields) signinFields.classList.remove('hidden');
    if (signupFields) signupFields.classList.add('hidden');
    if (roleSelectorSection) roleSelectorSection.classList.add('hidden');
    if (headingText) headingText.textContent = 'Welcome Back';
    if (subheadingText) subheadingText.textContent = 'Enter your email and password to access your account';
  }

  updateAuthSubmitButtonText();
}

function updateAuthSubmitButtonText() {
  const submitText = document.getElementById('main-auth-submit-text');
  if (!submitText) return;
  if (state.authMode === 'signup') {
    submitText.textContent = 'Sign Up';
  } else {
    submitText.textContent = 'Sign In';
  }
}

function handleGoogleSignIn() {
  const role = state.authSelectedRole || 'product_owner';
  const demoEmailMap = {
    product_owner: 'alex@owner.com',
    service_center_staff: 'sarah@servicecenter.com',
    service_technician: 'david@technician.com',
    warranty_admin: 'elena@admin.com'
  };
  const email = demoEmailMap[role] || 'alex@owner.com';
  showToast(`Signing in via Google as ${email}...`);
  performLogin(email, 'password123');
}

function quickFillAndLogin(email, pwd = '12345678') {
  const emailInput = document.getElementById('main-auth-email');
  const pwdInput = document.getElementById('main-auth-password');
  if (emailInput) emailInput.value = email;
  if (pwdInput) pwdInput.value = pwd;
  showToast(`Logging in as ${email}...`);
  performLogin(email, pwd);
}

function togglePasswordVisibility() {
  const pwd = document.getElementById('main-auth-password');
  const icon = document.getElementById('password-toggle-icon');
  if (pwd) {
    const isPassword = pwd.type === 'password';
    pwd.type = isPassword ? 'text' : 'password';
    if (icon) {
      icon.textContent = isPassword ? '🙈' : '👁️';
    }
  }
}

function toggleSignupPasswordVisibility() {
  const pwd = document.getElementById('signup-password');
  const icon = document.getElementById('signup-password-toggle-icon');
  if (pwd) {
    const isPassword = pwd.type === 'password';
    pwd.type = isPassword ? 'text' : 'password';
    if (icon) {
      icon.textContent = isPassword ? '🙈' : '👁️';
    }
  }
}

async function handleMainAuthSubmit(e) {
  e.preventDefault();
  const errorNotice = document.getElementById('auth-error-notice');
  const errorText = document.getElementById('auth-error-text');
  const successNotice = document.getElementById('auth-success-notice');
  const successText = document.getElementById('auth-success-text');

  if (errorNotice) errorNotice.classList.add('hidden');
  if (successNotice) successNotice.classList.add('hidden');

  function showAuthError(msg) {
    if (errorNotice) {
      errorText.textContent = msg;
      errorNotice.classList.remove('hidden');
    }
    showToast(msg);
  }

  if (state.authMode === 'signin') {
    // LOGIN: accepts Full Name or Email, and Password
    const identifier = (document.getElementById('main-auth-email')?.value || '').trim();
    const password = document.getElementById('main-auth-password')?.value || '';

    if (!identifier || !password) {
      showAuthError('Please provide your Full Name or Email Address, and Password.');
      return;
    }

    await performLogin(identifier, password);

  } else {
    // SIGNUP: Common to all four + role-specific questions
    const name = (document.getElementById('signup-name')?.value || '').trim();
    const email = (document.getElementById('signup-email')?.value || '').trim();
    const phone = (document.getElementById('signup-phone')?.value || '').trim();
    const password = document.getElementById('signup-password')?.value || '';
    const role = state.authSelectedRole;

    if (!name) {
      showAuthError('Full Name is required.');
      return;
    }
    if (!email || !email.includes('@')) {
      showAuthError('A valid Email Address is required.');
      return;
    }
    if (!phone) {
      showAuthError('Phone Number is required.');
      return;
    }
    if (!password) {
      showAuthError('Password is required.');
      return;
    }
    if (password.length < 8) {
      showAuthError('Password must be at least 8 characters long.');
      return;
    }

    const payload = {
      name,
      email,
      phone,
      password,
      role,
      is_email_verified: 1,
      is_phone_verified: 1
    };

    if (role === 'product_owner') {
      payload.address = (document.getElementById('signup-po-address')?.value || '').trim();
      payload.pincode = (document.getElementById('signup-po-pincode')?.value || '').trim();
    } else if (role === 'service_center_staff') {
      payload.organization = (document.getElementById('signup-staff-org')?.value || '').trim();
      payload.branch_code = (document.getElementById('signup-staff-branch-code')?.value || '').trim();
      payload.employee_id = (document.getElementById('signup-staff-emp-id')?.value || '').trim();
      payload.city = (document.getElementById('signup-staff-city')?.value || '').trim();
      payload.pincode = (document.getElementById('signup-staff-pincode')?.value || '').trim();

      if (!payload.organization || !payload.branch_code || !payload.employee_id) {
        showAuthError('Service Center Name, Branch/Center Code, and Employee ID are required for Service Staff.');
        return;
      }
    } else if (role === 'service_technician') {
      payload.organization = (document.getElementById('signup-tech-org')?.value || '').trim();
      payload.branch_code = (document.getElementById('signup-tech-branch-code')?.value || '').trim();
      payload.employee_id = (document.getElementById('signup-tech-emp-id')?.value || '').trim();
      payload.specialization = (document.getElementById('signup-tech-specialization')?.value || '').trim();
      payload.experience_level = document.getElementById('signup-tech-experience')?.value || 'Senior Specialist (5+ years)';
      payload.certifications = (document.getElementById('signup-tech-certification')?.value || '').trim();
      payload.service_area = (document.getElementById('signup-tech-service-area')?.value || '').trim();

      if (!payload.organization || !payload.employee_id || !payload.specialization) {
        showAuthError('Service Center Name, Technician ID, and Repair Specializations are required for Technicians.');
        return;
      }
    } else if (role === 'warranty_admin') {
      payload.organization = (document.getElementById('signup-admin-org')?.value || '').trim();
      if (!payload.organization) {
        showAuthError('Organization Name is required for Warranty Administrators.');
        return;
      }
    }

    const submitBtn = document.getElementById('main-auth-submit-btn');
    const submitText = document.getElementById('main-auth-submit-text');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
    }
    if (submitText) {
      submitText.textContent = 'Creating Account...';
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        state.authenticatedUser = json.user;
        state.currentUser = json.user;
        state.currentRole = json.user.role;
        sessionStorage.setItem('dwt_auth_user', JSON.stringify(json.user));
        sessionStorage.setItem('dwt_current_view', 'dashboard');
        if (successNotice) {
          successText.textContent = `Account created successfully! Launching ${json.user.name}'s workspace...`;
          successNotice.classList.remove('hidden');
        }
        showToast(`Welcome, ${json.user.name}!`);
        setTimeout(() => {
          updateUserUI();
          updateTopBarAuthState();
          showView('dashboard');
          switchRole(json.user.role);
        }, 500);
      } else {
        showAuthError(json.error || 'Registration failed.');
      }
    } catch (err) {
      showAuthError('Server error during registration. Please check your connection.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      }
      updateAuthSubmitButtonText();
    }
  }
}

async function performLogin(identifier, password) {
  const errorNotice = document.getElementById('auth-error-notice');
  const errorText = document.getElementById('auth-error-text');
  const submitBtn = document.getElementById('main-auth-submit-btn');
  const submitText = document.getElementById('main-auth-submit-text');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
  }
  if (submitText) {
    submitText.textContent = 'Signing In...';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, email: identifier, password })
    });
    const json = await res.json();
    if (json.success) {
      state.authenticatedUser = json.user;
      state.currentUser = json.user;
      state.currentRole = json.user.role;
      sessionStorage.setItem('dwt_auth_user', JSON.stringify(json.user));
      sessionStorage.setItem('dwt_current_view', 'dashboard');
      updateUserUI();
      updateTopBarAuthState();
      showView('dashboard');
      switchRole(json.user.role);
      showToast(`Welcome back, ${json.user.name}!`);
    } else {
      if (errorNotice) {
        errorText.textContent = json.error || 'Invalid name/email or password.';
        errorNotice.classList.remove('hidden');
      }
    }
  } catch (err) {
    if (errorNotice) {
      errorText.textContent = 'Server connection error. Please ensure backend is reachable.';
      errorNotice.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
    updateAuthSubmitButtonText();
  }
}

function logoutUser() {
  sessionStorage.removeItem('dwt_auth_user');
  sessionStorage.removeItem('dwt_current_view');
  state.authenticatedUser = null;
  state.currentUser = null;
  updateTopBarAuthState();
  showToast('You have been signed out.');
  showView('auth');
  selectAuthRole('product_owner');
}

function updateTopBarAuthState() {
  const logoutBtn = document.getElementById('nav-btn-logout');
  const authNavBtn = document.getElementById('nav-btn-auth');
  if (state.currentUser) {
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (authNavBtn) authNavBtn.classList.add('hidden');
  } else {
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (authNavBtn) authNavBtn.classList.remove('hidden');
  }
}

function formatRoleName(role) {
  const names = {
    product_owner: 'Product Owner',
    service_center_staff: 'Service Staff',
    service_technician: 'Technician',
    warranty_admin: 'Admin'
  };
  return names[role] || (role ? role.replace(/_/g, ' ') : 'User');
}

function handleUniversalSearch(term) {
  const lower = term.toLowerCase().trim();
  if (state.currentRole === 'product_owner') {
    const filtered = state.products.filter(p =>
      p.product_name.toLowerCase().includes(lower) ||
      p.serial_number.toLowerCase().includes(lower) ||
      p.brand.toLowerCase().includes(lower)
    );
    renderPoProductsTable(filtered);
  } else if (state.currentRole === 'service_center_staff') {
    const searchInput = document.getElementById('staff-search-input');
    if (searchInput) searchInput.value = term;
    loadStaffServiceQueue();
  } else if (state.currentRole === 'warranty_admin') {
    const searchInput = document.getElementById('admin-user-search');
    if (searchInput) searchInput.value = term;
    loadAdminUsers();
  }
}

function quickFileClaimForProduct(productId, productName) {
  showToast(`Initiating claim for ${productName}`);
  openServiceRequestModal();
  const sel = document.getElementById('sr-product-id');
  if (sel) sel.value = productId;
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function showToast(msg) {
  const existing = document.getElementById('app-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.className = 'fixed bottom-6 right-6 bg-black text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2 border border-gray-800 transition-all transform translate-y-0 opacity-100';
  toast.innerHTML = `<span>⚡</span><span>${msg}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
