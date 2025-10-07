// سیستم کاربران
const users = {
    "abolfazl": {name: "A سرپرست شیفت ", password: "a321", role: "supervisor"},
    "morteza": {name: "B سرپرست شیفت ", password: "m456", role: "supervisor"},
    "reza": {name: "C سرپرست شیفت ", password: "r789", role: "supervisor"},
    "director": {name: "رییس تولید", password: "d012", role: "director"},
    "manager": {name: "مدیر تولید", password: "2866", role: "manager"}
};

// متغیرهای گزارشات
let koor1Reports = JSON.parse(localStorage.getItem('koor1Reports')) || [];
let koor2Reports = JSON.parse(localStorage.getItem('koor2Reports')) || [];

// شمارنده برای شناسایی منحصر به فرد گروه‌های ورودی
let k1InputCounter = 1;
let k2Line2InputCounter = 1;
let k2Line3InputCounter = 1;

// تابع ورود به سیستم
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // اعتبارسنجی
    let isValid = true;
    
    if (!username) {
        showError('username-error', 'لطفاً نام کاربری را وارد کنید');
        document.getElementById('username').classList.add('input-error');
        isValid = false;
    } else {
        hideError('username-error');
        document.getElementById('username').classList.remove('input-error');
    }
    
    if (!password) {
        showError('password-error', 'لطفاً رمز عبور را وارد کنید');
        document.getElementById('password').classList.add('input-error');
        isValid = false;
    } else {
        hideError('password-error');
        document.getElementById('password').classList.remove('input-error');
    }
    
    if (!isValid) return;
    
    if(users[username] && users[username].password === password) {
        const user = users[username];
        localStorage.setItem('currentUser', JSON.stringify({
            name: user.name,
            role: user.role,
            userId: username
        }));
        
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        
        document.getElementById('welcome-message').innerHTML = `
            <p>کاربر گرامی: <strong>${user.name}</strong></p>
            <small>سطح دسترسی: ${getRoleName(user.role)}</small>
        `;
        
        setupAccessControls(user.role);
        loadPersianDatepicker();
        updateLiveStats();
        startClock();
        
        // فعال کردن بررسی در لحظه  
        setupAdvancedRealTimeValidation();
        // نمایش وضعیت اتصال
        updateConnectionStatus();
        
        showNotification('success', 'ورود موفق', 'با موفقیت وارد سیستم شدید');
    } else {
        showNotification('error', 'خطا در ورود', 'نام کاربری یا رمز عبور نامعتبر است');
    }
}

// فعال کردن ورود با اینتر
document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        login();
    }
});

// تابع بررسی تکراری بودن گزارش
function isDuplicateReport(koorType, date, shift) {
    const reports = koorType === 'koor1' ? koor1Reports : koor2Reports;
    return reports.some(report => {
        return report.date === date && report.shift === shift;
    });
}

// تابع نمایش وضعیت تکراری بودن
function showDuplicateStatus(koorType, dateElement, shiftElement) {
   const date = dateElement.value;
   const shift = shiftElement.value;

   if (!date || !shift) return;

   const isDuplicate = isDuplicateReport(koorType, date, shift);
   const statusElement = document.getElementById(`${koorType}-duplicate-status`) || createDuplicateStatusElement(koorType);

   if (isDuplicate) {
   statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> برای این تاریخ و شیفت قبلاً گزارشی ثبت شده است';
   statusElement.className = 'duplicate-warning';
   dateElement.classList.add('input-warning');
   shiftElement.classList.add('input-warning');
   } else {
   statusElement.innerHTML = '<i class="fas fa-check-circle"></i> تاریخ و شیفت قابل استفاده است';
   statusElement.className = 'duplicate-success';
   dateElement.classList.remove('input-warning');
   shiftElement.classList.remove('input-warning');
   }
}

// ایجاد المان وضعیت
function createDuplicateStatusElement(koorType) {
    const statusElement = document.createElement('div');
    statusElement.id = `${koorType}-duplicate-status`;
    statusElement.className = 'duplicate-status';

// پیدا کردن محل مناسب برای قرار دادن المان وضعیت
    const shiftElement = document.getElementById(`${koorType}-shift`);
    if (shiftElement && shiftElement.parentNode) {
    shiftElement.parentNode.parentNode.insertBefore(statusElement, shiftElement.parentNode.nextSibling);
}

   return statusElement;
}

// نسخه پیشرفته‌تر برای بررسی در لحظه
function setupAdvancedRealTimeValidation() {
    // برای کوره ۱
    const k1Date = document.getElementById("k1-date");
    const k1Shift = document.getElementById("k1-shift");
    
    if (k1Date && k1Shift) {
        k1Date.addEventListener('change', () => showDuplicateStatus('k1', k1Date, k1Shift));
        k1Shift.addEventListener('change', () => showDuplicateStatus('k1', k1Date, k1Shift));
    }
    
    // برای کوره ۲
    const k2Date = document.getElementById("k2-date");
    const k2Shift = document.getElementById("k2-shift");
    
    if (k2Date && k2Shift) {
        k2Date.addEventListener('change', () => showDuplicateStatus('k2', k2Date, k2Shift));
        k2Shift.addEventListener('change', () => showDuplicateStatus('k2', k2Date, k2Shift));
    }
}

// تابع تولید شناسه منحصر به فرد برای گزارشات
function generateReportId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function logout() {
    localStorage.removeItem('currentUser');
    showNotification('info', 'خروج از سیستم', 'با موفقیت از سیستم خارج شدید');
    setTimeout(() => {
        location.reload();
    }, 1500);
}

function getRoleName(role) {
    const roles = {
        'supervisor': 'سرپرست تولید',
        'director': 'رییس تولید',
        'manager': 'مدیر تولید'
    };
    return roles[role] || role;
}

function setupAccessControls(role) {
    const isSupervisor = role === 'supervisor';
    const isDirector = role === 'director';
    const isManager = role === 'manager';
    
    // نمایش تب مدیریت گزارشات برای مدیران
    const managementTab = document.getElementById('management-tab');
    if (managementTab) {
        managementTab.style.display = (isManager || isDirector) ? 'inline-block' : 'none';
    }
        document.getElementById('analysis-tab').style.display = (isManager || isDirector) ? 'inline-block' : 'none';
}

function loadPersianDatepicker() {
    $(".date-picker").persianDatepicker({
        format: 'YYYY/MM/DD',
        observer: true,
        initialValue: false
    });
}

// توابع مدیریت گروه‌های ورودی
function addInputGroup(type) {
    let containerId, counter, prefix;
    
    if (type === 'k1') {
        containerId = 'k1-inputs-container';
        counter = ++k1InputCounter;
        prefix = 'k1';
    } else if (type === 'k2-line2') {
        containerId = 'k2-line2-inputs-container';
        counter = ++k2Line2InputCounter;
        prefix = 'k2-line2';
    } else if (type === 'k2-line3') {
        containerId = 'k2-line3-inputs-container';
        counter = ++k2Line3InputCounter;
        prefix = 'k2-line3';
    }
    
    const groupId = `${prefix}-input-group-${counter}`;
    const container = document.getElementById(containerId);
    
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.id = groupId;
    
    let htmlContent = '';
    if (type === 'k1') {
        htmlContent = `
            <div class="input-group-header">
                <span class="input-group-title">ورودی تولید ${counter}</span>
                <button class="remove-input-btn" onclick="removeInputGroup('${groupId}')">حذف</button>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-width-${counter}">عرض با کناره (سانتی متر):</label>
                <input type="number" id="${prefix}-width-${counter}" step="0.01">
                <div class="error-message" id="${prefix}-width-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-weight-${counter}">وزن یک متر مربع شیشه (کیلوگرم):</label>
                <input type="number" id="${prefix}-weight-${counter}" step="0.001">
                <div class="error-message" id="${prefix}-weight-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-thickness-${counter}">ضخامت (میلیمتر):</label>
                <input type="number" id="${prefix}-thickness-${counter}" step="0.1">
                <div class="error-message" id="${prefix}-thickness-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-design-${counter}">نوع طرح:</label>
                <select id="${prefix}-design-${counter}">
                    <option value="برفی">برفی</option>
                    <option value="کاراتاچی">کاراتاچی</option>
                    <option value="برگ بیدی">برگ بیدی</option>
                    <option value="بازوبندی">بازوبندی</option>
                    <option value="بادی">بادی</option>
                    <option value="شاپرکی">شاپرکی</option>
                    <option value="الماسی">الماسی</option>
                    <option value="ماتریکس">ماتریکس</option>
                    <option value="نی ریز">نی ریز</option>
                    <option value="حبابی">حبابی</option>
                    <option value="بامبو">بامبو</option>
                    <option value="مدادی">مدادی</option>
                    <option value="راه مات">راه مات</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-speed-${counter}">سرعت (اینچ/دقیقه):</label>
                <input type="number" id="${prefix}-speed-${counter}" step="0.1">
                <div class="error-message" id="${prefix}-speed-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-hours-${counter}">ساعات کارکرد:</label>
                <input type="number" id="${prefix}-hours-${counter}" step="0.1">
                <div class="error-message" id="${prefix}-hours-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-delivery-width-${counter}">عرض تحویلی (سانتی متر):</label>
                <input type="number" id="${prefix}-delivery-width-${counter}" step="0.01">
                <div class="error-message" id="${prefix}-delivery-width-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-delivery-length-${counter}">طول تحویلی (سانتی متر):</label>
                <input type="number" id="${prefix}-delivery-length-${counter}" step="0.01">
                <div class="error-message" id="${prefix}-delivery-length-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-production-${counter}">مقدار تولید واقعی (متر مربع برحسب 2میل):</label>
                <input type="number" id="${prefix}-production-${counter}" step="0.01">
                <div class="error-message" id="${prefix}-production-${counter}-error"></div>
            </div>
        `;
    } else {
        htmlContent = `
            <div class="input-group-header">
                <span class="input-group-title">ورودی تولید ${prefix.includes('line2') ? 'خط ۲' : 'خط ۳'} - ${counter}</span>
                <button class="remove-input-btn" onclick="removeInputGroup('${groupId}')">حذف</button>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-width-${counter}">عرض با کناره (سانتی متر):</label>
                <input type="number" id="${prefix}-width-${counter}" step="0.01">
                <div class="error-message" id="${prefix}-width-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-weight-${counter}">وزن یک متر مربع شیشه (کیلوگرم):</label>
                <input type="number" id="${prefix}-weight-${counter}" step="0.001">
                <div class="error-message" id="${prefix}-weight-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-thickness-${counter}">ضخامت (میلیمتر):</label>
                <input type="number" id="${prefix}-thickness-${counter}" step="0.1">
                <div class="error-message" id="${prefix}-thickness-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-design-${counter}">نوع طرح:</label>
                <select id="${prefix}-design-${counter}">
                    <option value="برفی">برفی</option>
                    <option value="کاراتاچی">کاراتاچی</option>
                    <option value="برگ بیدی">برگ بیدی</option>
                    <option value="بازوبندی">بازوبندی</option>
                    <option value="بادی">بادی</option>
                    <option value="شاپرکی">شاپرکی</option>
                    <option value="الماسی">الماسی</option>
                    <option value="ماتریکس">ماتریکس</option>
                    <option value="نی ریز">نی ریز</option>
                    <option value="حبابی">حبابی</option>
                    <option value="بامبو">بامبو</option>
                    <option value="مدادی">مدادی</option>
                    <option value="راه مات">راه مات</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-speed-${counter}">سرعت (اینچ/دقیقه):</label>
                <input type="number" id="${prefix}-speed-${counter}" step="0.1">
                <div class="error-message" id="${prefix}-speed-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-hours-${counter}">ساعات کارکرد:</label>
                <input type="number" id="${prefix}-hours-${counter}" step="0.1">
                <div class="error-message" id="${prefix}-hours-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-delivery-width-${counter}">عرض تحویلی (سانتی متر):</label>
                <input type="number" id="${prefix}-delivery-width-${counter}" step="0.01">
                <div class="error-message" id="${prefix}-delivery-width-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-delivery-length-${counter}">طول تحویلی (سانتی متر):</label>
                <input type="number" id="${prefix}-delivery-length-${counter}" step="0.01">
                <div class="error-message" id="${prefix}-delivery-length-${counter}-error"></div>
            </div>
            
            <div class="form-group">
                <label for="${prefix}-production-${counter}">مقدار تولید واقعی (متر مربع برحسب 2میل):</label>
                <input type="number" id="${prefix}-production-${counter}" step="0.01">
                <div class="error-message" id="${prefix}-production-${counter}-error"></div>
            </div>
        `;
    }
    
    inputGroup.innerHTML = htmlContent;
    container.appendChild(inputGroup);
}

function removeInputGroup(groupId) {
    const group = document.getElementById(groupId);
    if (group) {
        group.remove();
    }
}

// توابع مربوط به کوره 1
function calculateKoor1() {
    // اعتبارسنجی داده‌ها
    if (!validateKoor1Inputs()) {
        showNotification('error', 'خطا در داده‌ها', 'لطفاً تمام فیلدهای ضروری را پر کنید');
        return;
    }
    
    const inputGroups = document.querySelectorAll('#k1-inputs-container .input-group');
    let totalDailyMelt = 0;
    let totalProduction = 0;
    let totalWeightedThickness = 0;
    
    inputGroups.forEach((group, index) => {
        const i = index + 1;
        const thickness = parseFloat(document.getElementById(`k1-thickness-${i}`).value) || 0;
        const width = parseFloat(document.getElementById(`k1-width-${i}`).value) || 0;
        const weight = parseFloat(document.getElementById(`k1-weight-${i}`).value) || 0;
        const speed = parseFloat(document.getElementById(`k1-speed-${i}`).value) || 0;
        const hours = parseFloat(document.getElementById(`k1-hours-${i}`).value) || 0;
        const production = parseFloat(document.getElementById(`k1-production-${i}`).value) || 0;

        const dailyMelt = speed * 2.54 * 60 * hours * (width / 100) * weight / 100;
        const WeightedThickness = (production * weight) / thickness;
        totalDailyMelt += dailyMelt;
        totalProduction += production;
        totalWeightedThickness += WeightedThickness;
    });

    const batchCount = parseInt(document.getElementById("k1-batch").value) || 0;
    const batchConsumption = batchCount * 649;
    const culletConsumption = (totalDailyMelt - ( batchConsumption * 0.815 ));
    const culletPercentage = totalDailyMelt > 0 ? (culletConsumption / totalDailyMelt) * 100 : 0;
    const efficiency = totalDailyMelt > 0 ? ((totalWeightedThickness * 2 ) / (totalDailyMelt )) * 100 : 0;
    const efficiencyExplanation = document.getElementById('k1-efficiency-explanation');
    if (efficiency < 80) {
      efficiencyExplanation.style.display = 'block';
    } else {
      efficiencyExplanation.style.display = 'none';
    }

    const silica = batchCount * 393;
    const sodiumCarbonate = batchCount * 129;
    const dolomite = batchCount * 122;
    const sodiumSulfate = batchCount * 4.883;
    const coal = batchCount * 0.117;

    const resultsDiv = document.getElementById("k1-results");
    resultsDiv.innerHTML = `
        <h3>نتایج محاسبات</h3>
        <div class="result-item">
            <strong>تعداد ورودی‌های تولید:</strong> ${inputGroups.length}
        </div>
        <div class="result-item">
            <strong>مقدار ذوب روزانه:</strong> ${totalDailyMelt.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>مقدار تولید روزانه:</strong> ${totalProduction.toFixed(2)} متر مربع 2میل
        </div>
        <div class="result-item">
            <strong>مقدار بچ مصرفی:</strong> ${batchConsumption.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>مقدار خرده شیشه مصرفی:</strong> ${culletConsumption.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>درصد خرده شیشه مصرفی:</strong> ${culletPercentage.toFixed(2)}%
        </div>
        <div class="result-item">
            <strong>راندمان کوره:</strong> ${efficiency.toFixed(2)}%
        </div>
        <h4>مصرف مواد</h4>
        <div class="result-item">
            <strong>پودر سیلیس:</strong> ${silica.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>کربنات سدیم:</strong> ${sodiumCarbonate.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>دولومیت:</strong> ${dolomite.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>سولفات سدیم:</strong> ${sodiumSulfate.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>ذغال:</strong> ${coal.toFixed(3)} کیلوگرم
        </div>
    `;

    window.koor1Results = {
        inputCount: inputGroups.length,
        totalDailyMelt: totalDailyMelt,
        totalProduction: totalProduction,
        batchConsumption: batchConsumption, 
        culletConsumption: culletConsumption,
        culletPercentage: culletPercentage, 
        efficiency: efficiency,
        materials: { silica, sodiumCarbonate, dolomite, sodiumSulfate, coal },
        inputs: []
    };

    inputGroups.forEach((group, index) => {
        const i = index + 1;
        window.koor1Results.inputs.push({
            width: document.getElementById(`k1-width-${i}`).value,
            weight: document.getElementById(`k1-weight-${i}`).value,
            thickness: document.getElementById(`k1-thickness-${i}`).value,
            design: document.getElementById(`k1-design-${i}`).value,
            speed: document.getElementById(`k1-speed-${i}`).value,
            hours: document.getElementById(`k1-hours-${i}`).value,
            deliveryWidth: document.getElementById(`k1-delivery-width-${i}`).value,
            deliveryLength: document.getElementById(`k1-delivery-length-${i}`).value,
            production: document.getElementById(`k1-production-${i}`).value
        });
    });
    
    showNotification('success', 'محاسبه موفق', 'محاسبات کوره ۱ با موفقیت انجام شد');
}

function saveKoor1() {
   const user = JSON.parse(localStorage.getItem('currentUser'));
   if (!user || !window.koor1Results) {
       showNotification('error', 'خطا در ذخیره', 'لطفاً ابتدا وارد سیستم شوید و محاسبات را انجام دهید');
       return;
   }

   const date = document.getElementById("k1-date").value;
   const shift = document.getElementById("k1-shift").value;

   // بررسی تکراری بودن گزارش
   if (isDuplicateReport('koor1', date, shift)) {
       showNotification('error', 'گزارش تکراری', 'برای این تاریخ و شیفت قبلاً گزارشی ثبت شده است');
       return;
   }

   const report = {
       ...window.koor1Results,
       date: date,
       shift: shift,
       batchCount: document.getElementById("k1-batch").value,
       enteredBy: user.name,
       userId: user.userId,
       timestamp: new Date().toISOString(),
       id: generateReportId() // اضافه کردن شناسه منحصر به فرد
   };

   koor1Reports.push(report);
   localStorage.setItem('koor1Reports', JSON.stringify(koor1Reports));

   // شبیه‌سازی ذخیره در ابر
   simulateCloudSave('koor1', report);

   showNotification('success', 'ذخیره موفق', `گزارش با موفقیت ${navigator.onLine ? 'در ابر' : 'به صورت آفلاین'} ثبت شد`);

   // به روزرسانی آمار زنده
   updateLiveStats();
}

function printKoor1() {
    window.print();
}

function exportKoor1Data() {
    if (!window.koor1Results) {
        showNotification('error', 'خطا در خروجی', 'لطفاً ابتدا محاسبات را انجام دهید');
        return;
    }
    
    const dataStr = JSON.stringify(window.koor1Results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `koor1_data_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('success', 'خروجی موفق', 'داده‌های کوره ۱ با موفقیت استخراج شد');
}

// توابع مربوط به کوره 2
function calculateKoor2() {
    // اعتبارسنجی داده‌ها
    if (!validateKoor2Inputs()) {
        showNotification('error', 'خطا در داده‌ها', 'لطفاً تمام فیلدهای ضروری را پر کنید');
        return;
    }
    
    const line2InputGroups = document.querySelectorAll('#k2-line2-inputs-container .input-group');
    let line2DailyMelt = 0;
    let line2Production = 0;
    let totalWeightedThickness2 = 0;
    
    line2InputGroups.forEach((group, index) => {
        const i = index + 1;
        const thickness = parseFloat(document.getElementById(`k2-line2-thickness-${i}`).value) || 0;
        const width = parseFloat(document.getElementById(`k2-line2-width-${i}`).value) || 0;
        const weight = parseFloat(document.getElementById(`k2-line2-weight-${i}`).value) || 0;
        const speed = parseFloat(document.getElementById(`k2-line2-speed-${i}`).value) || 0;
        const hours = parseFloat(document.getElementById(`k2-line2-hours-${i}`).value) || 0;
        const production = parseFloat(document.getElementById(`k2-line2-production-${i}`).value) || 0;

        const dailyMelt = speed * 2.54 * 60 * hours * (width / 100) * weight / 100;
        const WeightedThickness2 = (production * weight) / thickness;
        line2DailyMelt += dailyMelt;
        line2Production += production;
        totalWeightedThickness2 += WeightedThickness2;
    });

    const line3InputGroups = document.querySelectorAll('#k2-line3-inputs-container .input-group');
    let line3DailyMelt = 0;
    let line3Production = 0;
    let totalWeightedThickness3 = 0;
    
    line3InputGroups.forEach((group, index) => {
        const i = index + 1;
        const thickness = parseFloat(document.getElementById(`k2-line3-thickness-${i}`).value) || 0;
        const width = parseFloat(document.getElementById(`k2-line3-width-${i}`).value) || 0;
        const weight = parseFloat(document.getElementById(`k2-line3-weight-${i}`).value) || 0;
        const speed = parseFloat(document.getElementById(`k2-line3-speed-${i}`).value) || 0;
        const hours = parseFloat(document.getElementById(`k2-line3-hours-${i}`).value) || 0;
        const production = parseFloat(document.getElementById(`k2-line3-production-${i}`).value) || 0;

        const dailyMelt = speed * 2.54 * 60 * hours * (width / 100) * weight / 100;
        const WeightedThickness3 = (production * weight) / thickness;
        line3DailyMelt += dailyMelt;
        line3Production += production;
        totalWeightedThickness3 += WeightedThickness3;
    });

    const totalDailyMelt = line2DailyMelt + line3DailyMelt;
    const totalProduction = line2Production + line3Production;
    
    const batchCount = parseInt(document.getElementById("k2-batch").value) || 0;
    const batchConsumption = batchCount * 1655.12;
    const culletConsumption = (totalDailyMelt - batchConsumption * 0.815);
    const culletPercentage = totalDailyMelt > 0 ? (culletConsumption / totalDailyMelt) * 100 : 0;
    const efficiency = totalDailyMelt > 0 ? (((totalWeightedThickness2 + totalWeightedThickness3 ) * 2 ) / (totalDailyMelt )) * 100 : 0;
    const efficiencyExplanation = document.getElementById('k2-efficiency-explanation');
    if (efficiency < 80) {
       efficiencyExplanation.style.display = 'block';
    } else {
      efficiencyExplanation.style.display = 'none';
    }
    
    const silica = batchCount * 1010;
    const sodiumCarbonate = batchCount * 329;
    const dolomite = batchCount * 279;
    const lime = batchCount * 27;
    const sodiumSulfate = batchCount * 9.9;
    const coal = batchCount * 0.220;

    const resultsDiv = document.getElementById("k2-results");
    resultsDiv.innerHTML = `
        <h3>نتایج محاسبات</h3>
        <div class="result-item">
            <strong>تعداد ورودی‌های خط ۲:</strong> ${line2InputGroups.length}
        </div>
        <div class="result-item">
            <strong>تعداد ورودی‌های خط ۳:</strong> ${line3InputGroups.length}
        </div>
        <div class="result-item">
            <strong>مقدار ذوب روزانه خط ۲:</strong> ${line2DailyMelt.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>مقدار ذوب روزانه خط ۳:</strong> ${line3DailyMelt.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>مقدار ذوب کل کوره:</strong> ${totalDailyMelt.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>مقدار تولید روزانه:</strong> ${totalProduction.toFixed(2)} متر مربع 2میل
        </div>
        <div class="result-item">
            <strong>مقدار بچ مصرفی:</strong> ${batchConsumption.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>مقدار خرده شیشه مصرفی:</strong> ${culletConsumption.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>درصد خرده شیشه مصرفی:</strong> ${culletPercentage.toFixed(2)}%
        </div>
        <div class="result-item">
            <strong>راندمان کوره:</strong> ${efficiency.toFixed(2)}%
        </div>
        <h4>مصرف مواد</h4>
        <div class="result-item">
            <strong>پودر سیلیس:</strong> ${silica.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>کربنات سدیم:</strong> ${sodiumCarbonate.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>دولومیت:</strong> ${dolomite.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>آهک:</strong> ${lime.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>سولفات سدیم:</strong> ${sodiumSulfate.toFixed(2)} کیلوگرم
        </div>
        <div class="result-item">
            <strong>ذغال:</strong> ${coal.toFixed(3)} کیلوگرم
        </div>
    `;

    window.koor2Results = {
        line2InputCount: line2InputGroups.length,
        line3InputCount: line3InputGroups.length,
        line2DailyMelt: line2DailyMelt, 
        line3DailyMelt: line3DailyMelt, 
        totalDailyMelt: totalDailyMelt,
        batchConsumption: batchConsumption, 
        culletConsumption: culletConsumption,
        culletPercentage: culletPercentage, 
        efficiency: efficiency,
        materials: { silica, sodiumCarbonate, dolomite, lime, sodiumSulfate, coal },
        line2Inputs: [],
        line3Inputs: []
    };

    line2InputGroups.forEach((group, index) => {
        const i = index + 1;
        window.koor2Results.line2Inputs.push({
            width: document.getElementById(`k2-line2-width-${i}`).value,
            weight: document.getElementById(`k2-line2-weight-${i}`).value,
            thickness: document.getElementById(`k2-line2-thickness-${i}`).value,
            design: document.getElementById(`k2-line2-design-${i}`).value,
            speed: document.getElementById(`k2-line2-speed-${i}`).value,
            hours: document.getElementById(`k2-line2-hours-${i}`).value,
            deliveryWidth: document.getElementById(`k2-line2-delivery-width-${i}`).value,
            deliveryLength: document.getElementById(`k2-line2-delivery-length-${i}`).value,
            production: document.getElementById(`k2-line2-production-${i}`).value
        });
    });

    line3InputGroups.forEach((group, index) => {
        const i = index + 1;
        window.koor2Results.line3Inputs.push({
            width: document.getElementById(`k2-line3-width-${i}`).value,
            weight: document.getElementById(`k2-line3-weight-${i}`).value,
            thickness: document.getElementById(`k2-line3-thickness-${i}`).value,
            design: document.getElementById(`k2-line3-design-${i}`).value,
            speed: document.getElementById(`k2-line3-speed-${i}`).value,
            hours: document.getElementById(`k2-line3-hours-${i}`).value,
            deliveryWidth: document.getElementById(`k2-line3-delivery-width-${i}`).value,
            deliveryLength: document.getElementById(`k2-line3-delivery-length-${i}`).value,
            production: document.getElementById(`k2-line3-production-${i}`).value
        });
    });
    
    showNotification('success', 'محاسبه موفق', 'محاسبات کوره ۲ با موفقیت انجام شد');
}

function saveKoor2() {
   const user = JSON.parse(localStorage.getItem('currentUser'));
   if (!user || !window.koor2Results) {
       showNotification('error', 'خطا در ذخیره', 'لطفاً ابتدا وارد سیستم شوید و محاسبات را انجام دهید');
       return;
   }

   const date = document.getElementById("k2-date").value;
   const shift = document.getElementById("k2-shift").value;

   // بررسی تکراری بودن گزارش
   if (isDuplicateReport('koor2', date, shift)) {
       showNotification('error', 'گزارش تکراری', 'برای این تاریخ و شیفت قبلاً گزارشی ثبت شده است');
       return;
   }

   const report = {
       ...window.koor2Results,
       date: date,
       shift: shift,
       batchCount: document.getElementById("k2-batch").value,
       enteredBy: user.name,
       userId: user.userId,
       timestamp: new Date().toISOString(),
       id: generateReportId() // اضافه کردن شناسه منحصر به فرد
   };

   koor2Reports.push(report);
   localStorage.setItem('koor2Reports', JSON.stringify(koor2Reports));

   // شبیه‌سازی ذخیره در ابر
   simulateCloudSave('koor2', report);

   showNotification('success', 'ذخیره موفق', `گزارش با موفقیت ${navigator.onLine ? 'در ابر' : 'به صورت آفلاین'} ثبت شد`);

   // به روزرسانی آمار زنده
   updateLiveStats();
}

function printKoor2() {
    window.print();
}

function exportKoor2Data() {
    if (!window.koor2Results) {
        showNotification('error', 'خطا در خروجی', 'لطفاً ابتدا محاسبات را انجام دهید');
        return;
    }
    
    const dataStr = JSON.stringify(window.koor2Results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `koor2_data_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('success', 'خروجی موفق', 'داده‌های کوره ۲ با موفقیت استخراج شد');
}

// شبیه‌سازی ذخیره در ابر
function simulateCloudSave(koorType, report) {
    const syncStatus = document.getElementById('sync-status');
    syncStatus.style.display = 'block';
    
    if (navigator.onLine) {
        syncStatus.textContent = '🔄 در حال ذخیره در ابر...';
        syncStatus.style.backgroundColor = '#3498db';
        
        // شبیه‌سازی تاخیر شبکه
        setTimeout(() => {
            syncStatus.textContent = '✅ ذخیره در ابر موفق';
            syncStatus.style.backgroundColor = '#27ae60';
            
            setTimeout(() => {
                syncStatus.style.display = 'none';
            }, 3000);
        }, 2000);
    } else {
        syncStatus.textContent = '⚠️ داده به صورت آفلاین ذخیره شد';
        syncStatus.style.backgroundColor = '#f39c12';
        
        setTimeout(() => {
            syncStatus.style.display = 'none';
        }, 3000);
    }
}

// به روزرسانی وضعیت اتصال
function updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    statusElement.style.display = 'block';
    statusElement.textContent = navigator.onLine ? '🟢 آنلاین' : '🔴 آفلاین';
    statusElement.className = `connection-status ${navigator.onLine ? 'online' : 'offline'}`;
}

// گوش دادن به تغییرات وضعیت اتصال
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// توابع گزارش‌گیری
function showDailyReport() {
    const today = new persianDate().format('YYYY/MM/DD');
    const filteredReports = [...koor1Reports, ...koor2Reports].filter(report => {
        return report.date === today;
    });

    displayReports(filteredReports, 'گزارش روزانه - ' + today);
}

function showWeeklyReport() {
    const today = new persianDate();
    const weekStart = today.subtract('day', today.day()).format('YYYY/MM/DD');
    const weekEnd = today.add('day', 6 - today.day()).format('YYYY/MM/DD');
    
    const filteredReports = [...koor1Reports, ...koor2Reports].filter(report => {
        return report.date >= weekStart && report.date <= weekEnd;
    });

    displayReports(filteredReports, `گزارش هفتگی - از ${weekStart} تا ${weekEnd}`);
}

function showMonthlyReport() {
    const today = new persianDate();
    const monthStart = today.format('YYYY/MM/01');
    const monthEnd = today.endOf('month').format('YYYY/MM/DD');
    
    const filteredReports = [...koor1Reports, ...koor2Reports].filter(report => {
        return report.date >= monthStart && report.date <= monthEnd;
    });

    displayReports(filteredReports, `گزارش ماهانه - ${today.format('YYYY/MM')}`);
}

function showCustomReport() {
    const modal = document.getElementById("report-modal");
    document.getElementById("modal-title").textContent = "گزارش سفارشی";
    modal.style.display = "block";
}

function generateCustomReport() {
    const fromDate = document.getElementById("from-date").value;
    const toDate = document.getElementById("to-date").value;
    
    if (!fromDate || !toDate) {
        showNotification('error', 'خطا در گزارش', 'لطفاً بازه زمانی را مشخص کنید');
        return;
    }

    const filteredReports = [...koor1Reports, ...koor2Reports].filter(report => {
        return report.date >= fromDate && report.date <= toDate;
    });

    displayReports(filteredReports, `گزارش سفارشی - از ${fromDate} تا ${toDate}`);
    closeModal();
}

// تابع نمایش مدیریت گزارشات برای مدیر
function showReportManagement() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || (user.role !== 'manager' && user.role !== 'director')) {
        showNotification('error', 'عدم دسترسی', 'شما دسترسی لازم برای مدیریت گزارشات را ندارید');
        return;
    }

    const modal = document.getElementById("report-modal");
    document.getElementById("modal-title").textContent = "مدیریت گزارشات";
    
    // ایجاد محتوای مدیریت گزارشات
    const modalBody = document.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="report-management">
            <div class="search-filters">
                <div class="form-group">
                    <label for="search-date">تاریخ:</label>
                    <input type="text" id="search-date" class="date-picker">
                </div>
                <div class="form-group">
                    <label for="search-koor">کوره:</label>
                    <select id="search-koor">
                        <option value="all">همه</option>
                        <option value="koor1">کوره ۱</option>
                        <option value="koor2">کوره ۲</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="search-shift">شیفت:</label>
                    <select id="search-shift">
                        <option value="all">همه</option>
                        <option value="6-14">۶ تا ۱۴</option>
                        <option value="14-22">۱۴ تا ۲۲</option>
                        <option value="22-6">۲۲ تا ۶</option>
                    </select>
                </div>
                <button onclick="searchReports()" class="search-btn">
                    <i class="fas fa-search"></i> جستجو
                </button>
            </div>
            <div id="management-results" class="management-results">
                <!-- نتایج جستجو اینجا نمایش داده می‌شود -->
            </div>
        </div>
    `;
    
    // فعال‌سازی تقویم شمسی
    $("#search-date").persianDatepicker({
        format: 'YYYY/MM/DD',
        observer: true,
        initialValue: false
    });
    
    modal.style.display = "block";
    searchReports(); // نمایش همه گزارشات به صورت پیش‌فرض
}

// تابع جستجوی گزارشات
function searchReports() {
    const date = document.getElementById("search-date").value;
    const koor = document.getElementById("search-koor").value;
    const shift = document.getElementById("search-shift").value;
    
    let filteredReports = [];
    
    if (koor === 'all' || koor === 'koor1') {
        filteredReports = filteredReports.concat(koor1Reports.map(report => ({...report, koorType: 'کوره ۱'})));
    }
    
    if (koor === 'all' || koor === 'koor2') {
        filteredReports = filteredReports.concat(koor2Reports.map(report => ({...report, koorType: 'کوره ۲'})));
    }
    
    // فیلتر بر اساس تاریخ
    if (date) {
        filteredReports = filteredReports.filter(report => report.date === date);
    }
    
    // فیلتر بر اساس شیفت
    if (shift !== 'all') {
        filteredReports = filteredReports.filter(report => report.shift === shift);
    }
    
    displayManagementResults(filteredReports);
}

// تابع نمایش نتایج مدیریت گزارشات
function displayManagementResults(reports) {
    const resultsDiv = document.getElementById("management-results");
    
    if (reports.length === 0) {
        resultsDiv.innerHTML = "<p>گزارشی با معیارهای انتخابی یافت نشد</p>";
        return;
    }
    
    let html = `
        <h3>نتایج جستجو (${reports.length} گزارش)</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>تاریخ</th>
                    <th>شیفت</th>
                    <th>کوره</th>
                    <th>کاربر</th>
                    <th>تولید (m²)</th>
                    <th>راندمان (%)</th>
                    <th>زمان ثبت</th>
                    <th>عملیات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reports.forEach(report => {
        let production = 0;
        
        if (report.inputs) {
            // کوره ۱
            report.inputs.forEach(input => {
                production += parseFloat(input.production || 0);
            });
        } else {
            // کوره ۲
            if (report.line2Inputs) {
                report.line2Inputs.forEach(input => {
                    production += parseFloat(input.production || 0);
                });
            }
            if (report.line3Inputs) {
                report.line3Inputs.forEach(input => {
                    production += parseFloat(input.production || 0);
                });
            }
        }
        
        const timestamp = new Date(report.timestamp);
        const timeStr = timestamp.toLocaleTimeString('fa-IR');
        const dateStr = timestamp.toLocaleDateString('fa-IR');
        
        html += `
            <tr>
                <td>${report.date}</td>
                <td>${report.shift}</td>
                <td>${report.koorType}</td>
                <td>${report.enteredBy}</td>
                <td>${production.toFixed(2)}</td>
                <td>${report.efficiency ? report.efficiency.toFixed(2) : '0.00'}</td>
                <td>${dateStr} - ${timeStr}</td>
                <td>
                    <button class="edit-btn" onclick="editReport('${report.id}', '${report.koorType === 'کوره ۱' ? 'koor1' : 'koor2'}')">
                        <i class="fas fa-edit"></i> ویرایش
                    </button>
                    <button class="delete-btn" onclick="deleteReport('${report.id}', '${report.koorType === 'کوره ۱' ? 'koor1' : 'koor2'}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    resultsDiv.innerHTML = html;
}

// تابع ویرایش گزارش
function editReport(reportId, koorType) {
    const reports = koorType === 'koor1' ? koor1Reports : koor2Reports;
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
        showNotification('error', 'خطا', 'گزارش مورد نظر یافت نشد');
        return;
    }
    
    // بسته به نوع کوره، تب مربوطه را باز می‌کنیم
    if (koorType === 'koor1') {
        openTab(event, 'koor1');
        
        // پر کردن فرم با داده‌های گزارش
        document.getElementById("k1-date").value = report.date;
        document.getElementById("k1-shift").value = report.shift;
        document.getElementById("k1-batch").value = report.batchCount;

    setTimeout(() => {
        const k1Date = document.getElementById("k1-date");
        const k1Shift = document.getElementById("k1-shift");
        showDuplicateStatus('k1', k1Date, k1Shift);
    }, 100);
        
        // حذف گروه‌های ورودی موجود
        const container = document.getElementById("k1-inputs-container");
        container.innerHTML = '';
        
        // ایجاد گروه‌های ورودی بر اساس داده‌های گزارش
        report.inputs.forEach((input, index) => {
            addInputGroup('k1');
            const i = index + 1;
            
            document.getElementById(`k1-width-${i}`).value = input.width;
            document.getElementById(`k1-weight-${i}`).value = input.weight;
            document.getElementById(`k1-thickness-${i}`).value = input.thickness;
            document.getElementById(`k1-design-${i}`).value = input.design;
            document.getElementById(`k1-speed-${i}`).value = input.speed;
            document.getElementById(`k1-hours-${i}`).value = input.hours;
            document.getElementById(`k1-delivery-width-${i}`).value = input.deliveryWidth;
            document.getElementById(`k1-delivery-length-${i}`).value = input.deliveryLength;
            document.getElementById(`k1-production-${i}`).value = input.production;
        });
        
        // ذخیره شناسه گزارش برای به‌روزرسانی
        window.editingReportId = reportId;
        window.editingKoorType = koorType;
        
        // تغییر متن دکمه ذخیره
        const saveBtn = document.querySelector('#koor1 .button-group .success');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> به‌روزرسانی';
        saveBtn.onclick = updateKoor1Report;
        
    } else {
        openTab(event, 'koor2');
        
        // پر کردن فرم با داده‌های گزارش
        document.getElementById("k2-date").value = report.date;
        document.getElementById("k2-shift").value = report.shift;
        document.getElementById("k2-batch").value = report.batchCount;
        
        // بررسی وضعیت تکراری بودن (باید فوراً انجام شود)     
         setTimeout(() => {
           const k2Date = document.getElementById("k2-date");
           const k2Shift = document.getElementById("k2-shift");
           showDuplicateStatus('k2', k2Date, k2Shift);
        }, 100);

        // حذف گروه‌های ورودی موجود
        const line2Container = document.getElementById("k2-line2-inputs-container");
        const line3Container = document.getElementById("k2-line3-inputs-container");
        line2Container.innerHTML = '';
        line3Container.innerHTML = '';
        
        // ایجاد گروه‌های ورودی خط ۲
        if (report.line2Inputs) {
            report.line2Inputs.forEach((input, index) => {
                addInputGroup('k2-line2');
                const i = index + 1;
                
                document.getElementById(`k2-line2-width-${i}`).value = input.width;
                document.getElementById(`k2-line2-weight-${i}`).value = input.weight;
                document.getElementById(`k2-line2-thickness-${i}`).value = input.thickness;
                document.getElementById(`k2-line2-design-${i}`).value = input.design;
                document.getElementById(`k2-line2-speed-${i}`).value = input.speed;
                document.getElementById(`k2-line2-hours-${i}`).value = input.hours;
                document.getElementById(`k2-line2-delivery-width-${i}`).value = input.deliveryWidth;
                document.getElementById(`k2-line2-delivery-length-${i}`).value = input.deliveryLength;
                document.getElementById(`k2-line2-production-${i}`).value = input.production;
            });
        }
        
        // ایجاد گروه‌های ورودی خط ۳
        if (report.line3Inputs) {
            report.line3Inputs.forEach((input, index) => {
                addInputGroup('k2-line3');
                const i = index + 1;
                
                document.getElementById(`k2-line3-width-${i}`).value = input.width;
                document.getElementById(`k2-line3-weight-${i}`).value = input.weight;
                document.getElementById(`k2-line3-thickness-${i}`).value = input.thickness;
                document.getElementById(`k2-line3-design-${i}`).value = input.design;
                document.getElementById(`k2-line3-speed-${i}`).value = input.speed;
                document.getElementById(`k2-line3-hours-${i}`).value = input.hours;
                document.getElementById(`k2-line3-delivery-width-${i}`).value = input.deliveryWidth;
                document.getElementById(`k2-line3-delivery-length-${i}`).value = input.deliveryLength;
                document.getElementById(`k2-line3-production-${i}`).value = input.production;
            });
        }
        
        // ذخیره شناسه گزارش برای به‌روزرسانی
        window.editingReportId = reportId;
        window.editingKoorType = koorType;
        
        // تغییر متن دکمه ذخیره
        const saveBtn = document.querySelector('#koor2 .button-group .success');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> به‌روزرسانی';
        saveBtn.onclick = updateKoor2Report;
    }
    
    closeModal();
    showNotification('info', 'ویرایش گزارش', 'فرم با داده‌های گزارش انتخابی پر شد. پس از ویرایش، روی دکمه به‌روزرسانی کلیک کنید.');
}

// تابع به‌روزرسانی گزارش کوره ۱
function updateKoor1Report() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || !window.koor1Results) {
        showNotification('error', 'خطا در به‌روزرسانی', 'لطفاً ابتدا وارد سیستم شوید و محاسبات را انجام دهید');
        return;
    }

    const reportIndex = koor1Reports.findIndex(r => r.id === window.editingReportId);
    if (reportIndex === -1) {
        showNotification('error', 'خطا', 'گزارش مورد نظر یافت نشد');
        return;
    }

    const updatedReport = {
        ...window.koor1Results,
        date: document.getElementById("k1-date").value,
        shift: document.getElementById("k1-shift").value,
        batchCount: document.getElementById("k1-batch").value,
        enteredBy: user.name,
        userId: user.userId,
        timestamp: new Date().toISOString(),
        id: window.editingReportId // حفظ شناسه اصلی
    };

    koor1Reports[reportIndex] = updatedReport;
    localStorage.setItem('koor1Reports', JSON.stringify(koor1Reports));
    
    // بازنشانی دکمه ذخیره
    const saveBtn = document.querySelector('#koor1 .button-group .success');
    saveBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> ذخیره در ابر';
    saveBtn.onclick = saveKoor1;
    
    delete window.editingReportId;
    delete window.editingKoorType;
    
    showNotification('success', 'به‌روزرسانی موفق', 'گزارش با موفقیت به‌روزرسانی شد');
    updateLiveStats();
}

// تابع به‌روزرسانی گزارش کوره ۲
function updateKoor2Report() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || !window.koor2Results) {
        showNotification('error', 'خطا در به‌روزرسانی', 'لطفاً ابتدا وارد سیستم شوید و محاسبات را انجام دهید');
        return;
    }

    const reportIndex = koor2Reports.findIndex(r => r.id === window.editingReportId);
    if (reportIndex === -1) {
        showNotification('error', 'خطا', 'گزارش مورد نظر یافت نشد');
        return;
    }

    const updatedReport = {
        ...window.koor2Results,
        date: document.getElementById("k2-date").value,
        shift: document.getElementById("k2-shift").value,
        batchCount: document.getElementById("k2-batch").value,
        enteredBy: user.name,
        userId: user.userId,
        timestamp: new Date().toISOString(),
        id: window.editingReportId // حفظ شناسه اصلی
    };

    koor2Reports[reportIndex] = updatedReport;
    localStorage.setItem('koor2Reports', JSON.stringify(koor2Reports));
    
    // بازنشانی دکمه ذخیره
    const saveBtn = document.querySelector('#koor2 .button-group .success');
    saveBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> ذخیره در ابر';
    saveBtn.onclick = saveKoor2;
    
    delete window.editingReportId;
    delete window.editingKoorType;
    
    showNotification('success', 'به‌روزرسانی موفق', 'گزارش با موفقیت به‌روزرسانی شد');
    updateLiveStats();
}

// تابع حذف گزارش
function deleteReport(reportId, koorType) {
    if (!confirm('آیا از حذف این گزارش اطمینان دارید؟ این عمل قابل بازگشت نیست.')) {
        return;
    }
    
    const reports = koorType === 'koor1' ? koor1Reports : koor2Reports;
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
        showNotification('error', 'خطا', 'گزارش مورد نظر یافت نشد');
        return;
    }
    
    reports.splice(reportIndex, 1);
    localStorage.setItem(koorType + 'Reports', JSON.stringify(reports));
    
    showNotification('success', 'حذف موفق', 'گزارش با موفقیت حذف شد');
    searchReports(); // به‌روزرسانی لیست
    updateLiveStats();
}

function displayReports(reports, title) {
    const resultsDiv = document.getElementById("reports-results");
    
    if (reports.length === 0) {
        resultsDiv.innerHTML = "<p>گزارشی برای بازه انتخابی یافت نشد</p>";
        return;
    }

    let html = `
        <h3>${title}</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>تاریخ</th>
                    <th>شیفت</th>
                    <th>کوره</th>
                    <th>کاربر</th>
                    <th>تولید (m²)</th>
                    <th>ذوب (kg)</th>
                    <th>بچ (kg)</th>
                    <th>خرده شیشه (kg)</th>
                    <th>درصد خرده</th>
                    <th>راندمان (%)</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalProduction = 0;
    let totalMelt = 0;
    let totalBatch = 0;
    let totalCullet = 0;
    let totalEfficiency = 0;

    reports.forEach(report => {
        let production = 0;
        let koorType = 'کوره ۱';
        
        if (report.inputs) {
            // کوره ۱
            report.inputs.forEach(input => {
                production += parseFloat(input.production || 0);
            });
        } else {
            // کوره ۲
            koorType = 'کوره ۲';
            if (report.line2Inputs) {
                report.line2Inputs.forEach(input => {
                    production += parseFloat(input.production || 0);
                });
            }
            if (report.line3Inputs) {
                report.line3Inputs.forEach(input => {
                    production += parseFloat(input.production || 0);
                });
            }
        }

        html += `
            <tr>
                <td>${report.date}</td>
                <td>${report.shift}</td>
                <td>${koorType}</td>
                <td>${report.enteredBy}</td>
                <td>${production.toFixed(2)}</td>
                <td>${report.totalDailyMelt.toFixed(2)}</td>
                <td>${report.batchConsumption.toFixed(2)}</td>
                <td>${report.culletConsumption.toFixed(2)}</td>
                <td>${report.culletPercentage.toFixed(2)}</td>
                <td>${report.efficiency.toFixed(2)}</td>
            </tr>
        `;

        totalProduction += production;
        totalMelt += report.totalDailyMelt;
        totalBatch += report.batchConsumption;
        totalCullet += report.culletConsumption;
        totalEfficiency += report.efficiency;
    });

    const avgEfficiency = reports.length > 0 ? totalEfficiency / reports.length : 0;

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4"><strong>جمع کل/میانگین</strong></td>
                    <td>${totalProduction.toFixed(2)}</td>
                    <td>${totalMelt.toFixed(2)}</td>
                    <td>${totalBatch.toFixed(2)}</td>
                    <td>${totalCullet.toFixed(2)}</td>
                    <td></td>
                    <td>${avgEfficiency.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
    `;

    resultsDiv.innerHTML = html;
}

// توابع عمومی
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }

    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function closeModal() {
    document.getElementById("report-modal").style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById("report-modal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// آمار زنده
function updateLiveStats() {
    const totalReports = koor1Reports.length + koor2Reports.length;
    document.getElementById('total-reports').textContent = totalReports;
    
    // محاسبه تولید امروز
    const today = new persianDate().format('YYYY/MM/DD');
    let todayProduction = 0;
    
    koor1Reports.forEach(report => {
        if (report.date === today) {
            report.inputs.forEach(input => {
                todayProduction += parseFloat(input.production || 0);
            });
        }
    });
    
    koor2Reports.forEach(report => {
        if (report.date === today) {
            if (report.line2Inputs) {
                report.line2Inputs.forEach(input => {
                    todayProduction += parseFloat(input.production || 0);
                });
            }
            if (report.line3Inputs) {
                report.line3Inputs.forEach(input => {
                    todayProduction += parseFloat(input.production || 0);
                });
            }
        }
    });
    
    document.getElementById('today-production').textContent = todayProduction.toFixed(2);
    
    // محاسبه میانگین راندمان
    let totalEfficiency = 0;
    let efficiencyCount = 0;
    
    koor1Reports.forEach(report => {
        if (report.efficiency) {
            totalEfficiency += report.efficiency;
            efficiencyCount++;
        }
    });
    
    koor2Reports.forEach(report => {
        if (report.efficiency) {
            totalEfficiency += report.efficiency;
            efficiencyCount++;
        }
    });
    
    const avgEfficiency = efficiencyCount > 0 ? (totalEfficiency / efficiencyCount) : 0;
    document.getElementById('avg-efficiency').textContent = avgEfficiency.toFixed(2) + '%';
    
    // محاسبه تولید ماه جاری
    const monthStart = new persianDate().format('YYYY/MM/01');
    const monthEnd = new persianDate().endOf('month').format('YYYY/MM/DD');
    let monthlyTotal = 0;
    
    [...koor1Reports, ...koor2Reports].forEach(report => {
        if (report.date >= monthStart && report.date <= monthEnd) {
            let production = 0;
            
            if (report.inputs) {
                report.inputs.forEach(input => {
                    production += parseFloat(input.production || 0);
                });
            } else {
                if (report.line2Inputs) {
                    report.line2Inputs.forEach(input => {
                        production += parseFloat(input.production || 0);
                    });
                }
                if (report.line3Inputs) {
                    report.line3Inputs.forEach(input => {
                        production += parseFloat(input.production || 0);
                    });
                }
            }
            
            monthlyTotal += production;
        }
    });
    
    document.getElementById('monthly-total').textContent = monthlyTotal.toFixed(2);
}

// ساعت و تاریخ    
function startClock() {
 updateDateTime();
 setInterval(updateDateTime, 1000);
}

function updateDateTime() {
  try {
    const now = new Date();
    
    // محاسبه زمان ایران (UTC+3:30)
    const localOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const iranOffset = 3.5 * 60 * 60 * 1000; // Iran is UTC+3:30 in milliseconds
    const iranTime = new Date(now.getTime() + localOffset + iranOffset);
    
    // استفاده از persianDate با زمان ایران
    const persianNow = new persianDate(iranTime);
    const dateTimeStr = persianNow.format('YYYY/MM/DD - HH:mm:ss');
    
    document.getElementById('datetime').textContent = dateTimeStr;
    
 } catch (error) {
  // Fallback در صورت خطا
  console.error('Error updating datetime:', error);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('fa-IR');
  document.getElementById('datetime').textContent = timeStr;
}
}

// اعتبارسنجی
function validateKoor1Inputs() {
    let isValid = true;
    
    // اعتبارسنجی تاریخ
    if (!document.getElementById("k1-date").value) {
        showError('k1-date-error', 'لطفاً تاریخ را انتخاب کنید');
        document.getElementById("k1-date").classList.add('input-error');
        isValid = false;
    } else {
        hideError('k1-date-error');
        document.getElementById("k1-date").classList.remove('input-error');
    }
    
    // اعتبارسنجی بچ
    if (!document.getElementById("k1-batch").value) {
        showError('k1-batch-error', 'لطفاً تعداد بچ مصرفی را وارد کنید');
        document.getElementById("k1-batch").classList.add('input-error');
        isValid = false;
    } else {
        hideError('k1-batch-error');
        document.getElementById("k1-batch").classList.remove('input-error');
    }
    
    // اعتبارسنجی ورودی‌ها
    const inputGroups = document.querySelectorAll('#k1-inputs-container .input-group');
    inputGroups.forEach((group, index) => {
        const i = index + 1;
        const requiredFields = ['width', 'weight', 'thickness', 'speed', 'hours', 'production'];
        
        requiredFields.forEach(field => {
            const fieldId = `k1-${field}-${i}`;
            if (!document.getElementById(fieldId).value) {
                showError(`${fieldId}-error`, `لطفاً ${getFieldName(field)} را وارد کنید`);
                document.getElementById(fieldId).classList.add('input-error');
                isValid = false;
            } else {
                hideError(`${fieldId}-error`);
                document.getElementById(fieldId).classList.remove('input-error');
            }
        });
    });
    
    return isValid;
}

function validateKoor2Inputs() {
    let isValid = true;
    
    // اعتبارسنجی تاریخ
    if (!document.getElementById("k2-date").value) {
        showError('k2-date-error', 'لطفاً تاریخ را انتخاب کنید');
        document.getElementById("k2-date").classList.add('input-error');
        isValid = false;
    } else {
        hideError('k2-date-error');
        document.getElementById("k2-date").classList.remove('input-error');
    }
    
    // اعتبارسنجی بچ
    if (!document.getElementById("k2-batch").value) {
        showError('k2-batch-error', 'لطفاً تعداد بچ مصرفی را وارد کنید');
        document.getElementById("k2-batch").classList.add('input-error');
        isValid = false;
    } else {
        hideError('k2-batch-error');
        document.getElementById("k2-batch").classList.remove('input-error');
    }
    
    // اعتبارسنجی ورودی‌های خط ۲
    const line2InputGroups = document.querySelectorAll('#k2-line2-inputs-container .input-group');
    line2InputGroups.forEach((group, index) => {
        const i = index + 1;
        const requiredFields = ['width', 'weight', 'thickness', 'speed', 'hours', 'production'];
        
        requiredFields.forEach(field => {
            const fieldId = `k2-line2-${field}-${i}`;
            if (!document.getElementById(fieldId).value) {
                showError(`${fieldId}-error`, `لطفاً ${getFieldName(field)} خط ۲ را وارد کنید`);
                document.getElementById(fieldId).classList.add('input-error');
                isValid = false;
            } else {
                hideError(`${fieldId}-error`);
                document.getElementById(fieldId).classList.remove('input-error');
            }
        });
    });
    
    // اعتبارسنجی ورودی‌های خط ۳
    const line3InputGroups = document.querySelectorAll('#k2-line3-inputs-container .input-group');
    line3InputGroups.forEach((group, index) => {
        const i = index + 1;
        const requiredFields = ['width', 'weight', 'thickness', 'speed', 'hours', 'production'];
        
        requiredFields.forEach(field => {
            const fieldId = `k2-line3-${field}-${i}`;
            if (!document.getElementById(fieldId).value) {
                showError(`${fieldId}-error`, `لطفاً ${getFieldName(field)} خط ۳ را وارد کنید`);
                document.getElementById(fieldId).classList.add('input-error');
                isValid = false;
            } else {
                hideError(`${fieldId}-error`);
                document.getElementById(fieldId).classList.remove('input-error');
            }
        });
    });
    
    return isValid;
}

function getFieldName(field) {
    const fieldNames = {
        'width': 'عرض با کناره',
        'weight': 'وزن یک متر مربع شیشه',
        'thickness': 'ضخامت',
        'speed': 'سرعت',
        'hours': 'ساعات کارکرد',
        'production': 'مقدار تولید واقعی'
    };
    return fieldNames[field] || field;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

// نوتیفیکیشن
function showNotification(type, title, message) {
    const notificationArea = document.getElementById('notification-area');
    const notificationId = 'notification-' + Date.now();
    
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <div>
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
        <button class="notification-close" onclick="closeNotification('${notificationId}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notificationArea.appendChild(notification);
    
    // حذف خودکار پس از 5 ثانیه
    setTimeout(() => {
        closeNotification(notificationId);
    }, 5000);
}

function closeNotification(id) {
    const notification = document.getElementById(id);
    if (notification) {
        notification.style.animation = 'slideInRight 0.5s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// دکمه‌های شناور
function showQuickReport() {
    openTab(event, 'reports');
    showDailyReport();
}

function quickSave() {
    const activeTab = document.querySelector('.tab-content.active').id;
    if (activeTab === 'koor1' && window.koor1Results) {
        saveKoor1();
    } else if (activeTab === 'koor2' && window.koor2Results) {
        saveKoor2();
    } else {
        showNotification('warning', 'ذخیره سریع', 'لطفاً ابتدا محاسبات را انجام دهید');
    }
}

function quickPrint() {
    const activeTab = document.querySelector('.tab-content.active').id;
    if (activeTab === 'koor1') {
        printKoor1();
    } else if (activeTab === 'koor2') {
        printKoor2();
    } else {
        window.print();
    }
}

// بررسی وضعیت لاگین هنگام بارگذاری صفحه
window.onload = function() {
    const user = localStorage.getItem('currentUser');
    if(user) {
        try {
            const userObj = JSON.parse(user);
            // بررسی معتبر بودن کاربر
            if(userObj && userObj.name && users[userObj.userId]) {
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('app-content').style.display = 'block';
                
                document.getElementById('welcome-message').innerHTML = `
                    <p>کاربر گرامی: <strong>${userObj.name}</strong></p>
                    <small>سطح دسترسی: ${getRoleName(userObj.role)}</small>
                `;
                setupAccessControls(userObj.role);
                
                // به روزرسانی وضعیت اتصال
                updateConnectionStatus();
                updateLiveStats();
                startClock();
                loadPersianDatepicker();
            } else {
                // اگر کاربر معتبر نیست، از سیستم خارج شو
                localStorage.removeItem('currentUser');
                showLoginPage();
            }
        } catch (e) {
            // اگر خطایی در پارس کردن JSON بود
            localStorage.removeItem('currentUser');
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
    
    // فعال‌سازی تقویم شمسی
    $(".date-picker").persianDatepicker({
        format: 'YYYY/MM/DD',
        observer: true,
        initialValue: false
    });
};

function showLoginPage() {
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('app-content').style.display = 'none';
}
