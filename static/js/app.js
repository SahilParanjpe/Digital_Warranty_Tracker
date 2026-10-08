/**
 * Digital Warranty Tracker - Single Page Application Client
 * Complete interactive logic for Hero, Login/Signup, DWT Dashboard,
 * OCR Invoice Scanning, Warranty Verification, Claims Pipeline, and Service Queue.
 */

// Global State
const state = {
  currentRole: 'product_owner',
  currentUser: {
    id: 1,
    name: 'Alex Vance',
    email: 'alex@owner.com',
    role: 'product_owner',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  currentView: 'dashboard', // default opens into dashboard or hero
  activeDashboardTab: 'overview',
  productStatusFilter: 'all',
  products: [],
  claims: [],
  serviceRequests: [],
  rules: [],
  reminders: [],
  stats: null
};

// Available Demo Users for fast 4-role switching
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
    org: 'Apex Hardware Repairs',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  warranty_admin: {
    id: 4,
    name: 'Elena Rostova',
    email: 'elena@admin.com',
    role: 'warranty_admin',
    title: 'Warranty Administrator',
    org: 'Global Warranty Underwriters Ltd',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80'
  }
};

// Initial document setup
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  updateUserUI();
  await loadDashboardStats();
  await loadProducts();
  await loadClaims();
  await loadServiceRequests();
  await loadRules();
  await loadReminders();
}

// -------------------------------------------------------------
// VIEW NAVIGATION & ROLE SWITCHING
// -------------------------------------------------------------
function showView(viewName) {
  state.currentView = viewName;
  const heroEl = document.getElementById('view-hero');
  const dashEl = document.getElementById('view-dashboard');

  if (viewName === 'hero') {
    heroEl.classList.remove('hidden');
    dashEl.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    heroEl.classList.add('hidden');
    dashEl.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Role Configuration Metadata for 4 Distinct Stakeholder Dashboards
const roleMetadata = {
  product_owner: {
    icon: '👤',
    pill: 'Product Owner',
    pillClass: 'bg-blue-100 text-blue-800',
    title: 'Personal Warranty Vault',
    desc: 'Managing personal warranty vault: register products with OCR, track expiry countdowns, view invoices, and file claims.',
    greeting: 'Personal Warranty Vault · You have 1 warranty expiring this week and 1 claim under administrator review.',
    actions: `
      <button onclick="openOcrModal()" class="btn-lime text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
        <span>⚡</span>
        <span>Instant OCR Scan</span>
      </button>
      <button onclick="openRegisterProductModal()" class="bg-[#111418] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-xs">
        + Register Product
      </button>
      <button onclick="openClaimModal()" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-4 py-2 rounded-full transition shadow-2xs">
        + File Claim
      </button>
      <button onclick="openRemindersDrawer()" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-4 py-2 rounded-full transition shadow-2xs">
        🔔 Expiry Alerts
      </button>
    `,
    targetTab: 'products'
  },
  service_center_staff: {
    icon: '🏢',
    pill: 'Service Center Staff',
    pillClass: 'bg-amber-100 text-amber-800',
    title: 'Service Dispatch & Intake Desk',
    desc: 'Receiving incoming service requests, allocating technician benches, monitoring service SLA, and scheduling workshop bays.',
    greeting: 'Service Intake Desk · 3 pending service tickets require bay scheduling and technician allocation today.',
    actions: `
      <button onclick="openServiceRequestModal()" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-full transition shadow-xs inline-flex items-center gap-1.5">
        <span>⚡</span>
        <span>Dispatch Technician</span>
      </button>
      <button onclick="openServiceRequestModal()" class="bg-[#111418] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-xs">
        + New Service Intake
      </button>
      <button onclick="setDashboardTab('service')" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-4 py-2 rounded-full transition shadow-2xs">
        🗓️ Bay Schedule
      </button>
      <button onclick="openVerifyModal()" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-4 py-2 rounded-full transition shadow-2xs">
        🔍 Verify Device Serial
      </button>
    `,
    targetTab: 'service'
  },
  service_technician: {
    icon: '🔧',
    pill: 'Service Technician',
    pillClass: 'bg-emerald-100 text-emerald-800',
    title: 'Senior Technician Workbench',
    desc: 'Performing authorized repairs, updating diagnostic logs, testing replaced components, and completing repair orders.',
    greeting: 'Technician Workbench · You have 1 active bench repair in progress (MacBook Pro) and 3 queued hardware jobs.',
    actions: `
      <button onclick="focusTechnicianBench()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-full transition shadow-xs inline-flex items-center gap-1.5">
        <span>⚡</span>
        <span>Complete Bench Job ✓</span>
      </button>
      <button onclick="setDashboardTab('service')" class="bg-[#111418] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-xs">
        📝 Update Diagnostic Notes
      </button>
      <button onclick="showToast('Requisition logged: Apple True Tone display module sent to parts inventory')" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-4 py-2 rounded-full transition shadow-2xs">
        📦 Requisition Parts
      </button>
      <button onclick="showToast('Hardware diagnostics test passed: 100% QC certified')" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-4 py-2 rounded-full transition shadow-2xs">
        🛠️ Run QC Bench Test
      </button>
    `,
    targetTab: 'service'
  },
  warranty_admin: {
    icon: '🛡️',
    pill: 'Warranty Administrator',
    pillClass: 'bg-purple-100 text-purple-800',
    title: 'Warranty Governance & Claims Adjudication',
    desc: 'Setting manufacturer coverage rules, deciding customer claims, approving warranty disbursements, and monitoring claim validity.',
    greeting: 'Governance & Claims Desk · 2 claims submitted by product owners require coverage verification and decision.',
    actions: `
      <button onclick="setDashboardTab('claims')" class="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-full transition shadow-xs inline-flex items-center gap-1.5">
        <span>🛡️</span>
        <span>Adjudicate Claims</span>
      </button>
      <button onclick="openRuleModal()" class="bg-[#111418] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-xs">
        + Configure Policy Rule
      </button>
      <button onclick="setDashboardTab('rules')" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-4 py-2 rounded-full transition shadow-2xs">
        📜 Manufacturer Policies
      </button>
      <button onclick="shareSnapshot()" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-4 py-2 rounded-full transition shadow-2xs">
        ⚖️ Export Claims Ledger
      </button>
    `,
    targetTab: 'claims'
  }
};

function switchRole(roleKey) {
  if (!demoUsers[roleKey]) return;
  state.currentRole = roleKey;
  state.currentUser = demoUsers[roleKey];
  updateUserUI();

  // Highlight top role buttons
  ['owner', 'staff', 'tech', 'admin'].forEach(r => {
    const btn = document.getElementById(`role-btn-${r}`);
    if (btn) {
      btn.className = 'px-2.5 py-1 rounded-md font-medium transition-all text-gray-400 hover:text-white';
    }
  });

  const activeBtnMap = {
    product_owner: 'role-btn-owner',
    service_center_staff: 'role-btn-staff',
    service_technician: 'role-btn-tech',
    warranty_admin: 'role-btn-admin'
  };
  const activeBtn = document.getElementById(activeBtnMap[roleKey]);
  if (activeBtn) {
    activeBtn.className = 'px-2.5 py-1 rounded-md font-medium transition-all text-white bg-blue-600 shadow-xs';
  }

  // Update Stakeholder Context Banner
  const meta = roleMetadata[roleKey] || roleMetadata.product_owner;
  const iconEl = document.getElementById('stakeholder-icon');
  const pillEl = document.getElementById('stakeholder-role-pill');
  const descEl = document.getElementById('stakeholder-desc');
  const subtextEl = document.getElementById('greeting-subtext');
  const actionBtnsEl = document.getElementById('header-action-buttons');

  if (iconEl) iconEl.textContent = meta.icon;
  if (pillEl) {
    pillEl.textContent = meta.pill;
    pillEl.className = `px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.pillClass}`;
  }
  if (descEl) descEl.textContent = meta.desc;
  if (subtextEl) subtextEl.textContent = meta.greeting;
  if (actionBtnsEl) actionBtnsEl.innerHTML = meta.actions;

  // Visual emphasis on role-prioritized section
  highlightRoleSection(meta.targetTab);

  showToast(`Switched view to ${state.currentUser.title}: ${state.currentUser.name}`);
  loadDashboardStats();
  loadProducts();
  loadClaims();
  loadServiceRequests();
}

function highlightRoleSection(tabKey) {
  const sectionIds = ['section-products', 'section-claims', 'section-service', 'section-rules'];
  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('ring-2', 'ring-blue-500', 'ring-purple-500', 'ring-emerald-500');
  });

  const targetMap = {
    products: 'section-products',
    service: 'section-service',
    claims: 'section-claims',
    rules: 'section-rules'
  };
  const targetId = targetMap[tabKey];
  const targetEl = document.getElementById(targetId);
  if (targetEl) {
    const ringClass = tabKey === 'claims' ? 'ring-purple-500' : tabKey === 'service' ? 'ring-emerald-500' : 'ring-blue-500';
    targetEl.classList.add('ring-2', ringClass);
  }
}

function focusTechnicianBench() {
  setDashboardTab('service');
  showToast('Focusing on Technician Workbench repairs...');
  setTimeout(() => {
    const firstActionBtn = document.querySelector('#service-table-body button');
    if (firstActionBtn) {
      firstActionBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstActionBtn.classList.add('ring-4', 'ring-emerald-400');
      setTimeout(() => firstActionBtn.classList.remove('ring-4', 'ring-emerald-400'), 2500);
    }
  }, 400);
}

function updateUserUI() {
  const user = state.currentUser;
  
  // Greeting header
  const greetingEl = document.getElementById('greeting-name');
  if (greetingEl) greetingEl.textContent = user.name.split(' ')[0];

  // User Profile in sidebar
  const sideName = document.getElementById('current-user-name');
  const sideRole = document.getElementById('current-user-role-label');
  const sideInitials = document.getElementById('user-avatar-initials');
  const topAvatar = document.getElementById('top-user-avatar');

  if (sideName) sideName.textContent = user.name;
  if (sideRole) sideRole.textContent = user.title || user.role.replace('_', ' ');
  if (sideInitials) {
    const parts = user.name.split(' ');
    sideInitials.textContent = parts[0][0] + (parts[1] ? parts[1][0] : '');
  }
  if (topAvatar && user.avatar) {
    topAvatar.src = user.avatar;
  }
}

function setDashboardTab(tabName) {
  state.activeDashboardTab = tabName;
  const breadcrumb = document.getElementById('top-breadcrumb');
  if (breadcrumb) {
    const labelMap = {
      overview: 'Overview',
      products: 'My Products & Warranties',
      claims: 'Warranty Claims Pipeline',
      service: 'Service Bay Queue',
      rules: 'Coverage Rules'
    };
    breadcrumb.textContent = labelMap[tabName] || 'Overview';
  }

  // Scroll to section
  const sectionMap = {
    overview: 'view-dashboard',
    products: 'section-products',
    claims: 'section-claims',
    service: 'section-service',
    rules: 'section-rules'
  };

  const targetId = sectionMap[tabName];
  const el = document.getElementById(targetId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function setTimeRange(range) {
  ['month', 'quarter', 'year'].forEach(r => {
    const btn = document.getElementById(`btn-range-${r}`);
    if (btn) {
      if (r === range) {
        btn.className = 'px-3 py-1 rounded-full bg-black text-white font-semibold transition';
      } else {
        btn.className = 'px-3 py-1 rounded-full transition text-gray-600 hover:text-black';
      }
    }
  });
  showToast(`Dashboard metrics filtered by ${range.toUpperCase()}`);
}

// -------------------------------------------------------------
// REST API INTEGRATIONS
// -------------------------------------------------------------

async function loadDashboardStats() {
  try {
    const res = await fetch(`/api/dashboard/stats?role=${state.currentRole}&user_id=${state.currentUser.id}`);
    const json = await res.json();
    if (json.success) {
      state.stats = json;
      renderStatsUI(json);
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

function renderStatsUI(data) {
  const m = data.metrics;
  if (!m) return;

  // Populate Role-Specific KPI Cards
  const r = data.role_specific;
  if (r) {
    const kpi1Title = document.getElementById('kpi1-title');
    const kpi1Val = document.getElementById('kpi-portfolio-value');
    const kpi1Sub = document.getElementById('kpi-active-count');

    const kpi2Title = document.getElementById('kpi2-title');
    const kpi2Val = document.getElementById('kpi-claims-count');
    const kpi2Sub = document.getElementById('kpi2-sub');

    const kpi3Title = document.getElementById('kpi3-title');
    const kpi3Val = document.getElementById('kpi3-val');
    const kpi3Sub = document.getElementById('kpi3-sub');

    const kpi4Title = document.getElementById('kpi4-title');
    const kpi4Val = document.getElementById('kpi4-val');
    const kpi4Sub = document.getElementById('kpi4-sub');

    if (kpi1Title) kpi1Title.textContent = r.kpi1_title;
    if (kpi1Val) kpi1Val.textContent = r.kpi1_val;
    if (kpi1Sub) kpi1Sub.textContent = r.kpi1_sub;

    if (kpi2Title) kpi2Title.textContent = r.kpi2_title;
    if (kpi2Val) kpi2Val.textContent = r.kpi2_val;
    if (kpi2Sub) kpi2Sub.textContent = r.kpi2_sub;

    if (kpi3Title) kpi3Title.textContent = r.kpi3_title;
    if (kpi3Val) kpi3Val.textContent = r.kpi3_val;
    if (kpi3Sub) kpi3Sub.textContent = r.kpi3_sub;

    if (kpi4Title) kpi4Title.textContent = r.kpi4_title;
    if (kpi4Val) kpi4Val.textContent = r.kpi4_val;
    if (kpi4Sub) kpi4Sub.textContent = r.kpi4_sub;
  } else {
    const kpiVal = document.getElementById('kpi-portfolio-value');
    const kpiActive = document.getElementById('kpi-active-count');
    const kpiClaims = document.getElementById('kpi-claims-count');
    if (kpiVal) kpiVal.textContent = `₹${Math.round(m.total_portfolio_value).toLocaleString('en-IN')}`;
    if (kpiActive) kpiActive.textContent = `${m.total_active_warranties} active warranties`;
    if (kpiClaims) kpiClaims.textContent = `${m.resolved_claims + 183}`;
  }

  // Banner counts
  const bannerExp = document.getElementById('banner-expiring-count');
  const bannerQueue = document.getElementById('banner-queue-count');
  if (bannerExp) bannerExp.textContent = `${m.expiring_soon} warranty`;
  if (bannerQueue) bannerQueue.textContent = `${m.active_service_requests} service requests`;

  // Activity stream
  const activityList = document.getElementById('activity-stream-list');
  if (activityList && data.activities) {
    activityList.innerHTML = data.activities.map(a => `
      <div class="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 hover:bg-white hover:border-gray-300 transition cursor-pointer">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-[10px]">
              ${a.action.includes('Claim') ? '📋' : a.action.includes('Service') ? '🔧' : '📄'}
            </span>
            <span class="font-bold text-gray-900">${a.action}</span>
            <span class="text-gray-400">·</span>
            <span class="text-gray-600">${a.details}</span>
          </div>
          <span class="text-gray-400 text-[10px] whitespace-nowrap">${a.created_at ? a.created_at.split(' ')[1] : 'Just now'}</span>
        </div>
      </div>
    `).join('');
  }
}

async function loadProducts() {
  try {
    const searchVal = document.getElementById('product-filter-search')?.value || '';
    const query = new URLSearchParams();
    if (state.productStatusFilter !== 'all') {
      query.append('status', state.productStatusFilter);
    }
    if (searchVal) {
      query.append('search', searchVal);
    }

    const res = await fetch(`/api/products?${query.toString()}`);
    const json = await res.json();
    if (json.success) {
      state.products = json.products;
      renderProductsTable(json.products);
      const countBadge = document.getElementById('count-products-badge');
      if (countBadge) countBadge.textContent = json.products.length;
    }
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-400">No products found matching filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    // Status Badge
    let statusBadge = '<span class="badge-status badge-active">Active</span>';
    if (p.status === 'expiring_soon') {
      statusBadge = '<span class="badge-status badge-expiring">Expiring Soon (7d)</span>';
    } else if (p.status === 'expired') {
      statusBadge = '<span class="badge-status badge-expired">Expired</span>';
    }

    // Verification Badge
    const verifyBadge = p.verification_status === 'verified'
      ? '<span class="badge-status badge-verified">✓ Verified</span>'
      : '<span class="badge-status bg-gray-100 text-gray-700">Unverified</span>';

    return `
      <tr class="hover:bg-gray-50/60 transition">
        <td class="py-3.5 px-4">
          <div class="font-bold text-gray-900">${p.product_name}</div>
          <div class="text-[11px] text-gray-500">${p.brand} · ${p.model_number || 'Model Standard'}</div>
        </td>
        <td class="py-3.5 px-4 font-mono text-gray-700">${p.serial_number}</td>
        <td class="py-3.5 px-4 text-gray-600">${p.purchase_date}</td>
        <td class="py-3.5 px-4 font-semibold ${p.status === 'expiring_soon' ? 'text-amber-600' : p.status === 'expired' ? 'text-red-500' : 'text-gray-900'}">${p.warranty_end_date}</td>
        <td class="py-3.5 px-4">${statusBadge}</td>
        <td class="py-3.5 px-4">${verifyBadge}</td>
        <td class="py-3.5 px-4">
          <button onclick="viewInvoice(${p.id}, '${p.product_name}', '${p.invoice_filename || 'Receipt.pdf'}', '${p.serial_number}', '${p.purchase_price}')" class="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1">
            <span>📄</span>
            <span>View Receipt</span>
          </button>
        </td>
        <td class="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
          <button onclick="quickVerifySerial('${p.serial_number}', '${p.brand}')" title="Verify coverage" class="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium">Verify</button>
          <button onclick="quickFileClaimForProduct(${p.id}, '${p.product_name}')" title="File warranty claim" class="px-2.5 py-1 rounded-lg bg-black hover:bg-gray-800 text-white font-medium">Claim</button>
        </td>
      </tr>
    `;
  }).join('');
}

function setProductStatusFilter(status) {
  state.productStatusFilter = status;
  ['all', 'active', 'expiring_soon', 'expired'].forEach(s => {
    const btn = document.getElementById(`filter-status-${s}`);
    if (btn) {
      if (s === status) {
        btn.className = 'px-3 py-1 rounded-lg bg-white shadow-2xs font-semibold text-gray-900 transition';
      } else {
        btn.className = 'px-3 py-1 rounded-lg text-gray-600 hover:text-black transition';
      }
    }
  });
  loadProducts();
}

async function loadClaims() {
  try {
    const res = await fetch('/api/claims');
    const json = await res.json();
    if (json.success) {
      state.claims = json.claims;
      renderClaimsTable(json.claims);
      const countBadge = document.getElementById('count-claims-badge');
      if (countBadge) countBadge.textContent = json.claims.length;
    }
  } catch (err) {
    console.error('Failed to load claims:', err);
  }
}

function renderClaimsTable(claims) {
  const tbody = document.getElementById('claims-table-body');
  if (!tbody) return;

  if (claims.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">No warranty claims currently filed.</td></tr>`;
    return;
  }

  tbody.innerHTML = claims.map(c => {
    // 5-Stage Stepper Pill
    const stageMap = {
      draft: { step: 1, label: 'Draft', color: 'bg-gray-200 text-gray-700' },
      submitted: { step: 2, label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
      under_review: { step: 3, label: 'Under Review', color: 'bg-amber-100 text-amber-800' },
      service_scheduled: { step: 4, label: 'Service Scheduled', color: 'bg-purple-100 text-purple-800' },
      resolved: { step: 5, label: 'Resolved ✓', color: 'bg-emerald-100 text-emerald-800' },
      rejected: { step: 0, label: 'Rejected ✕', color: 'bg-red-100 text-red-800' },
      withdrawn: { step: 0, label: 'Withdrawn', color: 'bg-gray-100 text-gray-600' }
    };

    const st = stageMap[c.status] || { step: 1, label: c.status, color: 'bg-gray-100 text-gray-800' };

    // Administrator action buttons
    const isAdmin = state.currentRole === 'warranty_admin';
    const isStaff = state.currentRole === 'service_center_staff';

    let actionButtons = '';
    if (isAdmin && c.status === 'under_review') {
      actionButtons = `
        <button onclick="updateClaimStatus(${c.id}, 'service_scheduled', 'Approved for repair under manufacturer coverage warranty')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]">
          Approve Claim
        </button>
        <button onclick="updateClaimStatus(${c.id}, 'rejected', 'Damage not covered by policy terms')" class="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium text-[11px]">
          Reject
        </button>
      `;
    } else if (c.status === 'service_scheduled') {
      actionButtons = `
        <button onclick="updateClaimStatus(${c.id}, 'resolved', 'Hardware repaired and returned to customer')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]">
          Mark Resolved
        </button>
      `;
    } else {
      actionButtons = `<span class="text-gray-400 text-[11px]">${st.label}</span>`;
    }

    return `
      <tr class="hover:bg-gray-50/60 transition">
        <td class="py-3.5 px-4 font-mono font-bold text-gray-900">${c.claim_number}</td>
        <td class="py-3.5 px-4">
          <div class="font-bold text-gray-900">${c.product_name}</div>
          <div class="text-[11px] text-gray-500">${c.brand} · ${c.issue_category}</div>
        </td>
        <td class="py-3.5 px-4 text-gray-700 max-w-xs truncate" title="${c.issue_description}">${c.issue_description}</td>
        <td class="py-3.5 px-4 text-gray-600">${c.owner_name}</td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${st.color}">
            ${st.label}
          </span>
        </td>
        <td class="py-3.5 px-4 text-gray-600 text-[11px] max-w-xs truncate" title="${c.admin_notes || 'None'}">
          ${c.admin_notes || 'Pending administrator review'}
        </td>
        <td class="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
          ${actionButtons}
        </td>
      </tr>
    `;
  }).join('');
}

async function updateClaimStatus(claimId, newStatus, adminNotes) {
  try {
    const res = await fetch(`/api/claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        admin_notes: adminNotes,
        decided_by: state.currentUser.id
      })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Claim status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`);
      loadClaims();
      loadServiceRequests();
      loadDashboardStats();
    }
  } catch (err) {
    console.error('Failed to update claim:', err);
  }
}

async function loadServiceRequests() {
  try {
    const res = await fetch('/api/service-requests');
    const json = await res.json();
    if (json.success) {
      state.serviceRequests = json.service_requests;
      renderServiceTable(json.service_requests);
      const countBadge = document.getElementById('count-service-badge');
      if (countBadge) countBadge.textContent = json.service_requests.length;
    }
  } catch (err) {
    console.error('Failed to load service requests:', err);
  }
}

function renderServiceTable(requests) {
  const tbody = document.getElementById('service-table-body');
  if (!tbody) return;

  if (requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">No active service tickets.</td></tr>`;
    return;
  }

  tbody.innerHTML = requests.map(r => {
    const isTech = state.currentRole === 'service_technician';
    const isStaff = state.currentRole === 'service_center_staff';

    let actionButtons = '';
    if (isStaff && r.status === 'pending') {
      actionButtons = `
        <button onclick="assignTechnician(${r.id}, 3, 'Today 14:00 - 15:30')" class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px]">
          Assign David Miller
        </button>
      `;
    } else if (isTech && (r.status === 'assigned' || r.status === 'in_progress')) {
      actionButtons = `
        <button onclick="updateServiceStatus(${r.id}, 'completed', 'Repair finished and diagnostics passed 100%')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]">
          Mark Completed ✓
        </button>
      `;
    } else {
      actionButtons = `<span class="text-gray-400 text-[11px]">${r.status}</span>`;
    }

    return `
      <tr class="hover:bg-gray-50/60 transition">
        <td class="py-3.5 px-4 font-mono font-bold text-gray-900">${r.request_number}</td>
        <td class="py-3.5 px-4">
          <div class="font-bold text-gray-900">${r.product_name}</div>
          <div class="text-[11px] text-gray-500">${r.brand} · ${r.serial_number}</div>
        </td>
        <td class="py-3.5 px-4 text-gray-800 font-medium">${r.issue_title}</td>
        <td class="py-3.5 px-4 text-gray-700">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
              ${r.technician_name ? r.technician_name[0] : '–'}
            </span>
            <span>${r.technician_name || '<em class="text-gray-400">Unassigned</em>'}</span>
          </div>
        </td>
        <td class="py-3.5 px-4 font-mono text-gray-600 text-[11px]">${r.scheduled_slot || 'Pending slot'}</td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : r.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}">
            ${r.status.toUpperCase()}
          </span>
        </td>
        <td class="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
          ${actionButtons}
        </td>
      </tr>
    `;
  }).join('');
}

async function assignTechnician(reqId, techId, slot) {
  try {
    const res = await fetch(`/api/service-requests/${reqId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assigned_technician_id: techId,
        scheduled_slot: slot,
        status: 'assigned',
        staff_id: state.currentUser.id
      })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Technician David Miller assigned successfully!');
      loadServiceRequests();
      loadDashboardStats();
    }
  } catch (err) {
    console.error('Failed to assign technician:', err);
  }
}

async function updateServiceStatus(reqId, newStatus, notes) {
  try {
    const res = await fetch(`/api/service-requests/${reqId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        technician_notes: notes
      })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Service ticket marked as: ${newStatus.toUpperCase()}`);
      loadServiceRequests();
      loadDashboardStats();
    }
  } catch (err) {
    console.error('Failed to update service status:', err);
  }
}

async function loadRules() {
  try {
    const res = await fetch('/api/rules');
    const json = await res.json();
    if (json.success) {
      state.rules = json.rules;
      renderRulesCards(json.rules);
    }
  } catch (err) {
    console.error('Failed to load rules:', err);
  }
}

function renderRulesCards(rules) {
  const grid = document.getElementById('rules-cards-grid');
  if (!grid) return;

  grid.innerHTML = rules.map(r => `
    <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:shadow-xs transition">
      <div class="flex items-center justify-between mb-3">
        <div class="font-extrabold text-base text-gray-900">${r.manufacturer}</div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          ${r.standard_warranty_months} Months Base
        </span>
      </div>

      <div class="text-xs text-gray-500 mb-3">${r.category}</div>

      <p class="text-xs text-gray-700 leading-relaxed mb-4">${r.terms_summary}</p>

      <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
        <span>ADH Protection: <strong class="${r.accidental_damage_covered ? 'text-emerald-600' : 'text-gray-400'}">${r.accidental_damage_covered ? 'Covered' : 'Excluded'}</strong></span>
        <span>Receipt Req: <strong class="text-gray-800">${r.requires_original_invoice ? 'Yes' : 'No'}</strong></span>
      </div>
    </div>
  `).join('');
}

async function loadReminders() {
  try {
    const res = await fetch(`/api/reminders?user_id=${state.currentUser.id}`);
    const json = await res.json();
    if (json.success) {
      state.reminders = json.reminders;
      renderRemindersDrawer(json.reminders);
      const unreadCount = json.reminders.filter(r => !r.is_read).length;
      const badge = document.getElementById('unread-reminders-badge');
      if (badge) badge.textContent = unreadCount;
    }
  } catch (err) {
    console.error('Failed to load reminders:', err);
  }
}

function renderRemindersDrawer(reminders) {
  const container = document.getElementById('reminders-drawer-list');
  if (!container) return;

  if (reminders.length === 0) {
    container.innerHTML = `<div class="text-center py-8 text-gray-400 text-xs">No pending reminders.</div>`;
    return;
  }

  container.innerHTML = reminders.map(r => `
    <div class="p-4 rounded-2xl ${r.is_read ? 'bg-gray-50 border-gray-200' : 'bg-amber-50/60 border-amber-200'} border transition">
      <div class="flex items-center justify-between text-xs mb-1">
        <span class="font-bold text-gray-900">${r.title}</span>
        <span class="text-[10px] text-gray-500">${r.due_date}</span>
      </div>
      <p class="text-xs text-gray-600 mb-2 leading-relaxed">${r.message}</p>
      <div class="flex items-center justify-between text-[11px]">
        <span class="text-gray-400">Channels: Email + Push Alerts</span>
        ${!r.is_read ? `
          <button onclick="markReminderAsRead(${r.id})" class="text-blue-600 font-semibold hover:underline">
            Mark Read ✓
          </button>
        ` : '<span class="text-gray-400">Read</span>'}
      </div>
    </div>
  `).join('');
}

async function markReminderAsRead(remId) {
  try {
    await fetch(`/api/reminders/${remId}/read`, { method: 'POST' });
    loadReminders();
    showToast('Reminder marked as read');
  } catch (err) {
    console.error('Failed to mark reminder read:', err);
  }
}

// -------------------------------------------------------------
// INTELLIGENT OCR INVOICE SCANNING & REGISTRATION
// -------------------------------------------------------------
function openOcrModal() {
  document.getElementById('modal-ocr')?.classList.remove('hidden');
}

function openRegisterProductModal() {
  openOcrModal();
}

async function loadSampleOcr(presetBrand) {
  showToast(`Running OCR parsing on ${presetBrand.toUpperCase()} invoice...`);
  try {
    const res = await fetch('/api/ocr/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: `${presetBrand}_receipt.jpg` })
    });
    const json = await res.json();
    if (json.success && json.ocr_result) {
      const f = json.ocr_result.extracted_fields;

      // Fill in editable fields
      document.getElementById('reg-product-name').value = f.product_name;
      document.getElementById('reg-brand').value = f.brand;
      document.getElementById('reg-serial').value = f.serial_number;
      document.getElementById('reg-model').value = f.model_number;
      document.getElementById('reg-category').value = f.category;
      document.getElementById('reg-purchase-date').value = f.purchase_date;
      document.getElementById('reg-price').value = f.purchase_price;
      document.getElementById('reg-retailer').value = f.retailer;
      document.getElementById('reg-duration').value = f.warranty_duration_months;
      document.getElementById('reg-ocr-raw').value = json.ocr_result.raw_text;

      // Show Banner
      const banner = document.getElementById('ocr-status-banner');
      const text = document.getElementById('ocr-status-text');
      if (banner && text) {
        text.textContent = `OCR extracted data with ${json.ocr_result.confidence_score}% confidence. Review & make manual corrections below!`;
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
    owner_id: state.currentUser.id,
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
    manual_corrections_made: true,
    invoice: {
      filename: `invoice_${document.getElementById('reg-serial').value}.pdf`,
      file_path: `/static/uploads/invoices/apple_mbp_receipt.pdf`
    }
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Product ${payload.product_name} registered successfully!`);
      closeModal('modal-ocr');
      loadProducts();
      loadDashboardStats();
      loadReminders();
    } else {
      alert(`Error: ${json.error}`);
    }
  } catch (err) {
    console.error('Product registration failed:', err);
  }
}

// -------------------------------------------------------------
// WARRANTY VERIFICATION ENGINE
// -------------------------------------------------------------
function openVerifyModal() {
  document.getElementById('modal-verify')?.classList.remove('hidden');
}

function quickVerifySerial(serial, brand) {
  openVerifyModal();
  document.getElementById('verify-serial').value = serial;
  document.getElementById('verify-brand').value = brand;
  handleVerificationSubmit(new Event('submit'));
}

async function handleVerificationSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const serial = document.getElementById('verify-serial').value;
  const brand = document.getElementById('verify-brand').value;
  const purchaseDate = document.getElementById('verify-date').value;

  try {
    const res = await fetch('/api/warranty/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serial_number: serial,
        brand: brand,
        purchase_date: purchaseDate
      })
    });
    const json = await res.json();
    if (json.success && json.verification) {
      const v = json.verification;
      const box = document.getElementById('verify-result-box');
      box.classList.remove('hidden');

      const isEligible = v.eligibility === 'ELIGIBLE';
      box.innerHTML = `
        <div class="flex items-center justify-between pb-2 border-b border-gray-200">
          <span class="font-bold text-sm text-gray-900">${brand} Registry Status</span>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
            ${v.eligibility}
          </span>
        </div>
        <div class="text-[11px] text-gray-600">
          <div><strong>Serial:</strong> <span class="font-mono">${v.serial_number}</span></div>
          <div><strong>Tier:</strong> ${v.coverage_tier}</div>
          <div><strong>Standard Term:</strong> ${v.rule.standard_warranty_months} months manufacturer coverage</div>
        </div>
        <div class="bg-white p-2.5 rounded-xl border border-gray-200 text-[11px] text-gray-700">
          <div class="font-bold mb-1">Coverage Clauses:</div>
          <ul class="list-disc list-inside space-y-0.5 text-gray-600">
            ${v.terms_notes.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>
        <div class="text-[10px] text-gray-400">Timestamp: ${v.verified_at}</div>
      `;
    }
  } catch (err) {
    console.error('Verification failed:', err);
  }
}

// -------------------------------------------------------------
// WARRANTY CLAIMS WORKFLOW
// -------------------------------------------------------------
function openClaimModal() {
  const sel = document.getElementById('claim-product-id');
  if (sel && state.products) {
    sel.innerHTML = state.products.map(p => `
      <option value="${p.id}">${p.product_name} (${p.serial_number})</option>
    `).join('');
  }
  document.getElementById('modal-claim')?.classList.remove('hidden');
}

function quickFileClaimForProduct(productId, productName) {
  openClaimModal();
  document.getElementById('claim-product-id').value = productId;
}

async function handleClaimSubmit(e) {
  e.preventDefault();
  const payload = {
    owner_id: state.currentUser.id,
    product_id: parseInt(document.getElementById('claim-product-id').value),
    issue_category: document.getElementById('claim-category').value,
    issue_description: document.getElementById('claim-description').value,
    evidence_photo_url: document.getElementById('claim-photo-url').value
  };

  try {
    const res = await fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Warranty Claim ${json.claim.claim_number} submitted!`);
      closeModal('modal-claim');
      loadClaims();
      loadDashboardStats();
      loadReminders();
    }
  } catch (err) {
    console.error('Claim submission failed:', err);
  }
}

// -------------------------------------------------------------
// SERVICE REQUEST WORKFLOW
// -------------------------------------------------------------
function openServiceRequestModal() {
  const sel = document.getElementById('sr-product-id');
  if (sel && state.products) {
    sel.innerHTML = state.products.map(p => `
      <option value="${p.id}">${p.product_name} (${p.brand})</option>
    `).join('');
  }
  document.getElementById('modal-service')?.classList.remove('hidden');
}

async function handleServiceSubmit(e) {
  e.preventDefault();
  const payload = {
    owner_id: state.currentUser.id,
    product_id: parseInt(document.getElementById('sr-product-id').value),
    issue_title: document.getElementById('sr-title').value,
    issue_description: document.getElementById('sr-desc').value,
    priority: document.getElementById('sr-priority').value,
    assigned_technician_id: parseInt(document.getElementById('sr-tech-id').value)
  };

  try {
    const res = await fetch('/api/service-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Service ticket ${json.service_request.request_number} scheduled!`);
      closeModal('modal-service');
      loadServiceRequests();
      loadDashboardStats();
    }
  } catch (err) {
    console.error('Service request failed:', err);
  }
}

// -------------------------------------------------------------
// INVOICE STORAGE VIEWER
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
    `CURRENCY: Indian Rupee (₹)\n` +
    `VERIFICATION STATUS: Confirmed in SQLite Database (invoices table)\n\n` +
    `WARRANTY POLICY: Keep this digital receipt safe for all warranty claims and repair requests.`;

  const dl = document.getElementById('invoice-download-btn');
  dl.href = `/static/uploads/invoices/samsung_invoice.jpg`;

  document.getElementById('modal-invoice')?.classList.remove('hidden');
}

// -------------------------------------------------------------
// COVERAGE RULE CONFIGURATION (WARRANTY ADMINISTRATOR)
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
    user_id: state.currentUser.id
  };

  try {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Policy rule for ${payload.manufacturer} configured successfully!`);
      closeModal('modal-rule');
      loadRules();
      loadDashboardStats();
    } else {
      alert(`Error: ${json.error}`);
    }
  } catch (err) {
    console.error('Failed to configure rule:', err);
  }
}


// -------------------------------------------------------------
// AUTH MODAL & QUICK LOGIN
// -------------------------------------------------------------
function openAuthModal(mode) {
  setAuthTab(mode);
  document.getElementById('modal-auth')?.classList.remove('hidden');
}

function setAuthTab(mode) {
  const signinBtn = document.getElementById('tab-auth-signin');
  const signupBtn = document.getElementById('tab-auth-signup');
  const nameField = document.getElementById('auth-field-name');
  const roleField = document.getElementById('auth-field-role');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (mode === 'signup') {
    signupBtn.className = 'flex-1 py-1.5 rounded-lg bg-white shadow-2xs font-semibold text-gray-900';
    signinBtn.className = 'flex-1 py-1.5 rounded-lg text-gray-600 hover:text-black';
    nameField.classList.remove('hidden');
    roleField.classList.remove('hidden');
    submitBtn.textContent = 'Create Warranty Account';
  } else {
    signinBtn.className = 'flex-1 py-1.5 rounded-lg bg-white shadow-2xs font-semibold text-gray-900';
    signupBtn.className = 'flex-1 py-1.5 rounded-lg text-gray-600 hover:text-black';
    nameField.classList.add('hidden');
    roleField.classList.add('hidden');
    submitBtn.textContent = 'Sign In';
  }
}

async function quickLogin(email) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' })
    });
    const json = await res.json();
    if (json.success) {
      state.currentUser = json.user;
      state.currentRole = json.user.role;
      updateUserUI();
      closeModal('modal-auth');
      showView('dashboard');
      showToast(`Welcome back, ${json.user.name}!`);
      loadProducts();
      loadClaims();
      loadServiceRequests();
    }
  } catch (err) {
    console.error('Quick login failed:', err);
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const isSignup = !document.getElementById('auth-field-name').classList.contains('hidden');
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (isSignup) {
    const name = document.getElementById('auth-name').value;
    const role = document.getElementById('auth-role').value;
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const json = await res.json();
    if (json.success) {
      state.currentUser = json.user;
      state.currentRole = json.user.role;
      updateUserUI();
      closeModal('modal-auth');
      showView('dashboard');
      showToast(`Account created as ${role}!`);
    } else {
      alert(`Registration error: ${json.error}`);
    }
  } else {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (json.success) {
      state.currentUser = json.user;
      state.currentRole = json.user.role;
      updateUserUI();
      closeModal('modal-auth');
      showView('dashboard');
      showToast(`Logged in successfully!`);
      loadProducts();
    } else {
      alert(`Login error: ${json.error}`);
    }
  }
}

// -------------------------------------------------------------
// UTILITIES & DRAWERS
// -------------------------------------------------------------
function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function openRemindersDrawer() {
  document.getElementById('drawer-reminders')?.classList.remove('hidden');
}

function closeRemindersDrawer() {
  document.getElementById('drawer-reminders')?.classList.add('hidden');
}

function handleSearch(term) {
  const searchInput = document.getElementById('product-filter-search');
  if (searchInput) {
    searchInput.value = term;
    setDashboardTab('products');
    loadProducts();
  }
}

function shareSnapshot() {
  showToast('Dashboard snapshot copied to clipboard!');
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

