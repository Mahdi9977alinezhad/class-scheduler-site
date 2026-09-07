// ============================================
// سامانه برنامه‌ریزی کلاس‌ها 
// ============================================

var system = null;

function SchedulingSystem() {
    this.rooms = [];
    this.courses = [];
    this.schedule = [];
    
    // ===== ساعت‌ها حذف شدن - الان پویا هستن =====
    this.days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سهشنبه', 'چهارشنبه'];
    this.filters = { course: '', teacher: '', day: 'all', time: '', room: '' };
    this.loadData();
    this.renderAll();
}

// ============================================
// ذخیره و بازیابی داده
// ============================================

SchedulingSystem.prototype.saveData = function() {
    try {
        localStorage.setItem('rooms', JSON.stringify(this.rooms));
        localStorage.setItem('courses', JSON.stringify(this.courses));
        localStorage.setItem('schedule', JSON.stringify(this.schedule));
    } catch (e) {
        console.error('خطا در ذخیره:', e);
    }
};

SchedulingSystem.prototype.loadData = function() {
    try {
        var rooms = localStorage.getItem('rooms');
        var courses = localStorage.getItem('courses');
        var schedule = localStorage.getItem('schedule');
        if (rooms) this.rooms = JSON.parse(rooms);
        if (courses) this.courses = JSON.parse(courses);
        if (schedule) this.schedule = JSON.parse(schedule);
    } catch (e) {
        console.error('خطا در بارگذاری:', e);
    }
};

// ============================================
// دریافت ساعت‌های پویا از درس‌ها
// ============================================

SchedulingSystem.prototype.getTimeSlots = function() {
    var slots = [];
    for (var i = 0; i < this.courses.length; i++) {
        var time = this.courses[i].time;
        if (time && slots.indexOf(time) === -1) {
            slots.push(time);
        }
    }
    // مرتب‌سازی بر اساس ساعت شروع
    slots.sort(function(a, b) {
        var hourA = parseInt(a.split(':')[0]);
        var hourB = parseInt(b.split(':')[0]);
        return hourA - hourB;
    });
    return slots;
};

// ============================================
// مدیریت کلاس‌ها
// ============================================

SchedulingSystem.prototype.addRoom = function(event) {
    event.preventDefault();
    
    var name = document.getElementById('roomName').value.trim();
    var capacity = parseInt(document.getElementById('roomCapacity').value);
    
    if (!name) {
        this.showNotif('لطفاً نام کلاس را وارد کنید.', 'error');
        return;
    }
    
    if (isNaN(capacity) || capacity < 1) {
        this.showNotif('ظرفیت نامعتبر است.', 'error');
        return;
    }
    
    for (var i = 0; i < this.rooms.length; i++) {
        if (this.rooms[i].name === name) {
            this.showNotif('این کلاس قبلاً ثبت شده است.', 'error');
            return;
        }
    }
    
    this.rooms.push({ id: Date.now(), name: name, capacity: capacity });
    this.saveData();
    this.renderAll();
    document.getElementById('addRoomForm').reset();
    this.showNotif('کلاس "' + name + '" اضافه شد!');
};

SchedulingSystem.prototype.deleteRoom = function(id) {
    if (!confirm('آیا از حذف این کلاس مطمئن هستید؟')) return;
    
    var inUse = false;
    for (var i = 0; i < this.schedule.length; i++) {
        if (this.schedule[i].roomId === id) { inUse = true; break; }
    }
    
    if (inUse) {
        this.showNotif('این کلاس در برنامه استفاده شده است!', 'error');
        return;
    }
    
    var newRooms = [];
    for (var i = 0; i < this.rooms.length; i++) {
        if (this.rooms[i].id !== id) newRooms.push(this.rooms[i]);
    }
    this.rooms = newRooms;
    this.saveData();
    this.renderAll();
    this.showNotif('کلاس حذف شد.');
};

// ============================================
// مدیریت درس‌ها
// ============================================
SchedulingSystem.prototype.addCourse = function(event) {
    event.preventDefault();
    
    var nameInput = document.getElementById('courseName');
    var teacherInput = document.getElementById('teacherName');
    var studentInput = document.getElementById('studentCount');
    var daySelect = document.getElementById('courseDay');
    var timeInput = document.getElementById('courseTime');
    
    if (!nameInput || !teacherInput || !studentInput || !daySelect || !timeInput) {
        this.showNotif('خطا در فرم! لطفاً صفحه را رفرش کنید.', 'error');
        return;
    }
    
    var name = nameInput.value.trim();
    var teacher = teacherInput.value.trim();
    var studentCount = parseInt(studentInput.value);
    var day = daySelect.value;
    var time = timeInput.value.trim();
    
    if (!name) {
        this.showNotif('لطفاً نام درس را وارد کنید.', 'error');
        return;
    }
    
    if (!teacher) {
        this.showNotif('لطفاً نام استاد را وارد کنید.', 'error');
        return;
    }
    
    if (isNaN(studentCount) || studentCount < 1) {
        this.showNotif('تعداد دانشجویان نامعتبر است.', 'error');
        return;
    }
    
    if (!day) {
        this.showNotif('لطفاً روز را انتخاب کنید.', 'error');
        return;
    }
    
    if (!time) {
        this.showNotif('لطفاً ساعت را وارد کنید.', 'error');
        return;
    }
    
    if (this.rooms.length === 0) {
        this.showNotif('ابتدا کلاس‌ها را اضافه کنید!', 'error');
        return;
    }
    
    var room = this.findBestRoom(studentCount, day, time);
    
    if (!room) {
        this.showNotif('هیچ کلاس مناسبی برای ' + studentCount + ' دانشجو پیدا نشد!', 'error');
        return;
    }
    
    var course = {
        id: Date.now(),
        name: name,
        teacher: teacher,
        studentCount: studentCount,
        day: day,
        time: time,
        roomId: room.id,
        roomName: room.name
    };
    
    this.courses.push(course);
    this.schedule.push({
        courseId: course.id,
        day: day,
        timeSlot: time,
        roomId: room.id,
        roomName: room.name
    });
    
    this.saveData();
    this.renderAll();
    document.getElementById('addCourseForm').reset();
    this.showNotif('درس "' + name + '" با استاد "' + teacher + '" در کلاس "' + room.name + '" زمان‌بندی شد!');
};

SchedulingSystem.prototype.findBestRoom = function(studentCount, day, time) {
    var available = [];
    for (var i = 0; i < this.rooms.length; i++) {
        if (this.rooms[i].capacity >= studentCount) available.push(this.rooms[i]);
    }
    
    if (available.length === 0) return null;
    
    var busyRooms = [];
    for (var i = 0; i < this.schedule.length; i++) {
        var s = this.schedule[i];
        if (s.day === day && s.timeSlot === time) busyRooms.push(s.roomId);
    }
    
    var filtered = [];
    for (var i = 0; i < available.length; i++) {
        var isBusy = false;
        for (var j = 0; j < busyRooms.length; j++) {
            if (available[i].id === busyRooms[j]) { isBusy = true; break; }
        }
        if (!isBusy) filtered.push(available[i]);
    }
    
    if (filtered.length === 0) return null;
    
    var best = filtered[0];
    var bestDiff = Math.abs(best.capacity - studentCount);
    for (var i = 1; i < filtered.length; i++) {
        var diff = Math.abs(filtered[i].capacity - studentCount);
        if (diff < bestDiff) { bestDiff = diff; best = filtered[i]; }
    }
    return best;
};

SchedulingSystem.prototype.deleteCourse = function(id) {
    if (!confirm('آیا از حذف این درس مطمئن هستید؟')) return;
    
    var newCourses = [];
    for (var i = 0; i < this.courses.length; i++) {
        if (this.courses[i].id !== id) newCourses.push(this.courses[i]);
    }
    this.courses = newCourses;
    
    var newSchedule = [];
    for (var i = 0; i < this.schedule.length; i++) {
        if (this.schedule[i].courseId !== id) newSchedule.push(this.schedule[i]);
    }
    this.schedule = newSchedule;
    
    this.saveData();
    this.renderAll();
    this.showNotif('درس حذف شد.');
};
// ============================================
// تغییر دستی کلاس با قابلیت تغییر روز و ساعت
// ============================================

SchedulingSystem.prototype.showChangeRoomModal = function(courseId) {
    var course = null;
    for (var i = 0; i < this.courses.length; i++) {
        if (this.courses[i].id === courseId) {
            course = this.courses[i];
            break;
        }
    }
    if (!course) {
        this.showNotif('درس پیدا نشد!', 'error');
        return;
    }
    
    // ساخت مودال با قابلیت جستجو
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
    
    var content = document.createElement('div');
    content.style.cssText = 'background:white;padding:30px;border-radius:12px;max-width:600px;width:95%;max-height:85vh;overflow-y:auto;';
    
    var html = '<h3 style="margin-bottom:15px;">🔄 تغییر اطلاعات درس</h3>';
    html += '<div style="background:#f5f5f5;padding:12px;border-radius:8px;margin-bottom:15px;">';
    html += '<p style="margin:5px 0;"><strong>درس:</strong> ' + course.name + '</p>';
    html += '<p style="margin:5px 0;"><strong>استاد:</strong> ' + course.teacher + '</p>';
    html += '<p style="margin:5px 0;"><strong>دانشجویان:</strong> ' + course.studentCount + ' نفر</p>';
    html += '</div>';
    
    // ===== تغییر روز =====
    html += '<div class="form-group" style="margin-bottom:12px;">';
    html += '<label style="display:block;font-weight:bold;margin-bottom:4px;">روز جدید</label>';
    html += '<select id="newDay" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;">';
    for (var d = 0; d < this.days.length; d++) {
        var selected = (this.days[d] === course.day) ? 'selected' : '';
        html += '<option value="' + this.days[d] + '" ' + selected + '>' + this.days[d] + '</option>';
    }
    html += '</select>';
    html += '</div>';
    
    // ===== تغییر ساعت =====
    html += '<div class="form-group" style="margin-bottom:12px;">';
    html += '<label style="display:block;font-weight:bold;margin-bottom:4px;">ساعت جدید</label>';
    html += '<input type="text" id="newTime" value="' + course.time + '" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;" placeholder="مثال: 08:00-10:00">';
    html += '</div>';
    
    // ===== جستجوی کلاس =====
    html += '<div class="form-group" style="margin-bottom:12px;">';
    html += '<label style="display:block;font-weight:bold;margin-bottom:4px;">🔍 جستجوی کلاس</label>';
    html += '<input type="text" id="roomSearch" onkeyup="system.filterRoomsInModal()" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;" placeholder="نام کلاس را جستجو کنید...">';
    html += '</div>';
    
    // ===== لیست کلاس‌ها =====
    html += '<div id="roomListModal" style="max-height:250px;overflow-y:auto;border:1px solid #eee;border-radius:6px;padding:5px;">';
    
    var currentRoomId = course.roomId;
    for (var i = 0; i < this.rooms.length; i++) {
        var room = this.rooms[i];
        var isCurrent = (room.id === currentRoomId);
        var isAvailable = (room.capacity >= course.studentCount);
        
        // چک کردن تداخل
        var hasConflict = false;
        var newDay = course.day;
        var newTime = course.time;
        
        for (var j = 0; j < this.schedule.length; j++) {
            var item = this.schedule[j];
            if (item.courseId === courseId) continue;
            if (item.day === newDay && item.timeSlot === newTime && item.roomId === room.id) {
                hasConflict = true;
                break;
            }
        }
        var statusText = '';
        var statusColor = '';
        if (isCurrent) {
            statusText = '✅ کلاس فعلی';
            statusColor = '#4CAF50';
        } else if (hasConflict) {
            statusText = '❌ تداخل دارد';
            statusColor = '#f44336';
        } else if (!isAvailable) {
            statusText = '⚠️ ظرفیت کافی نیست';
            statusColor = '#ff9800';
        } else {
            statusText = '✅ قابل انتخاب';
            statusColor = '#2196F3';
        }
        
        var isDisabled = (isCurrent || hasConflict || !isAvailable) ? 'disabled' : '';
        var bgColor = isCurrent ? '#e8f5e9' : (hasConflict ? '#ffebee' : 'white');
        
        html += '<div class="room-item-modal" data-name="' + room.name.toLowerCase() + '" style="display:block;padding:8px 12px;margin-bottom:4px;border-radius:6px;background:' + bgColor + ';border:1px solid ' + (isCurrent ? '#4CAF50' : (hasConflict ? '#f44336' : '#eee')) + ';">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
        html += '<span><strong>' + room.name + '</strong> (ظرفیت: ' + room.capacity + ')</span>';
        html += '<span style="color:' + statusColor + ';font-size:13px;">' + statusText + '</span>';
        if (!isDisabled && !isCurrent) {
            html += '<button onclick="system.changeCourseRoom(' + courseId + ', ' + room.id + ')" style="padding:4px 14px;border:none;border-radius:4px;background:#2196F3;color:white;cursor:pointer;font-size:13px;">انتخاب</button>';
        }
        html += '</div>';
        html += '</div>';
    }
    
    html += '</div>';
    
    html += '<hr style="margin:15px 0;">';
    html += '<div style="display:flex;gap:10px;justify-content:flex-end;">';
    html += '<button onclick="system.closeModal(this)" style="padding:8px 20px;border:none;border-radius:6px;background:#f44336;color:white;cursor:pointer;">بستن</button>';
    html += '</div>';
    
    content.innerHTML = html;
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // بستن با کلیک بیرون
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // ذخیره مرجع مودال برای دسترسی در توابع دیگر
    this._currentModal = modal;
};

// ============================================
// فیلتر کلاس‌ها در مودال
// ============================================

SchedulingSystem.prototype.filterRoomsInModal = function() {
    var searchInput = document.getElementById('roomSearch');
    if (!searchInput) return;
    
    var searchText = searchInput.value.toLowerCase();
    var items = document.querySelectorAll('.room-item-modal');
    
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var name = item.getAttribute('data-name') || '';
        if (name.includes(searchText)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    }
};

// ============================================
// بستن مودال
// ============================================

SchedulingSystem.prototype.closeModal = function(button) {
    var modal = button.closest('div[style*="position:fixed"][style*="z-index:9999"]');
    if (modal) {
        modal.remove();
    }
};

// ============================================
// تغییر کلاس با قابلیت تغییر روز و ساعت
// ============================================

SchedulingSystem.prototype.changeCourseRoom = function(courseId, newRoomId) {
    // پیدا کردن درس
    var course = null;
    for (var i = 0; i < this.courses.length; i++) {
        if (this.courses[i].id === courseId) {
            course = this.courses[i];
            break;
        }
    }
    if (!course) {
        this.showNotif('درس پیدا نشد!', 'error');
        return;
    }
    
    // گرفتن روز و ساعت جدید از مودال
    var newDaySelect = document.getElementById('newDay');
    var newTimeInput = document.getElementById('newTime');
    
    var newDay = newDaySelect ? newDaySelect.value : course.day;
    var newTime = newTimeInput ? newTimeInput.value.trim() : course.time;
    
    if (!newDay || !newTime) {
        this.showNotif('لطفاً روز و ساعت را وارد کنید!', 'error');
        return;
    }
    
    // پیدا کردن کلاس جدید
    var newRoom = null;
    for (var i = 0; i < this.rooms.length; i++) {
        if (this.rooms[i].id === newRoomId) {
            newRoom = this.rooms[i];
            break;
        }
    }
    if (!newRoom) {
        this.showNotif('کلاس پیدا نشد!', 'error');
        return;
    }
    
    // ===== چک کردن ظرفیت =====
    if (newRoom.capacity < course.studentCount) {
        this.showNotif('❌ ظرفیت کلاس "' + newRoom.name + '" برای ' + course.studentCount + ' دانشجو کافی نیست!', 'error');
        return;
    }
    
    // ===== چک کردن تداخل =====
    var hasConflict = false;
    for (var i = 0; i < this.schedule.length; i++) {
        var item = this.schedule[i];
        if (item.courseId === courseId) continue;
        if (item.day === newDay && item.timeSlot === newTime && item.roomId === newRoomId) {
            hasConflict = true;
            break;
        }
    }
    
    if (hasConflict) {
        this.showNotif('❌ کلاس "' + newRoom.name + '" در روز ' + newDay + ' ساعت ' + newTime + ' قبلاً رزرو شده است!', 'error');
        return;
    }
    
    // ===== اعمال تغییرات =====
    var oldDay = course.day;
    var oldTime = course.time;
    var oldRoomName = course.roomName;
    
    course.day = newDay;
    course.time = newTime;
    course.roomId = newRoomId;
    course.roomName = newRoom.name;
    
    // پیدا کردن آیتم در schedule
    var scheduleItem = null;
    for (var i = 0; i < this.schedule.length; i++) {
        if (this.schedule[i].courseId === courseId) {
            scheduleItem = this.schedule[i];
            break;
        }
    }
    
    if (scheduleItem) {
        scheduleItem.day = newDay;
        scheduleItem.timeSlot = newTime;
        scheduleItem.roomId = newRoomId;
        scheduleItem.roomName = newRoom.name;
    }
    
    this.saveData();
    this.renderAll();
    
    // بستن مودال
    var modal = document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');
    if (modal) {
        modal.remove();
    }
    
    this.showNotif('✅ تغییرات با موفقیت اعمال شد! (' + oldRoomName + ' → ' + newRoom.name + ')');
};

// ============================================
// برنامه‌ریزی کامل هفته
// ============================================

SchedulingSystem.prototype.planFullWeek = function() {
    var status = document.getElementById('fullWeekStatus');
    this.showStatus('در حال برنامه‌ریزی...', 'info', status);
    
    if (this.rooms.length < 200) {
        this.showStatus('به حداقل 200 کلاس نیاز دارید! (' + this.rooms.length + ' کلاس موجود)', 'error', status);
        return;
    }
    
    if (this.courses.length === 0) {
        this.showStatus('هیچ درسی برای برنامه‌ریزی وجود ندارد!', 'error', status);
        return;
    }
    
    this.schedule = [];
    
    var sorted = [];
    for (var i = 0; i < this.courses.length; i++) sorted.push(this.courses[i]);
    sorted.sort(function(a, b) { return b.studentCount - a.studentCount; });
    
    var scheduled = 0;
    var failed = 0;
    
    for (var i = 0; i < sorted.length; i++) {
        var course = sorted[i];
        var room = this.findBestRoom(course.studentCount, course.day, course.time);
        
        if (room) {
            this.schedule.push({
                courseId: course.id,
                day: course.day,
                timeSlot: course.time,
                roomId: room.id,
                roomName: room.name
            });
            course.roomId = room.id;
            course.roomName = room.name;
            scheduled++;
        } else {
            failed++;
            course.roomId = null;
            course.roomName = 'پیدا نشد';
        }
    }
    
    this.saveData();
    this.renderAll();
    
    var msg = '';
    if (failed === 0) {
        msg = scheduled + ' درس با موفقیت زمان‌بندی شد!';
        this.showStatus(msg, 'success', status);
    } else {
        msg = scheduled + ' درس زمان‌بندی شد، ' + failed + ' درس زمان‌بندی نشد.';
        this.showStatus(msg, 'warning', status);
    }
    this.showNotif(msg);
};

// ============================================
// فیلترها
// ============================================

SchedulingSystem.prototype.filterCourses = function() {
    var courseInput = document.getElementById('filterCourse');
    var teacherInput = document.getElementById('filterTeacher');
    var daySelect = document.getElementById('filterDay');
    var timeSelect = document.getElementById('filterTime');  // تغییر به select
    var roomInput = document.getElementById('filterRoom');
    
    if (courseInput) this.filters.course = courseInput.value.toLowerCase();
    if (teacherInput) this.filters.teacher = teacherInput.value.toLowerCase();
    if (daySelect) this.filters.day = daySelect.value;
    
    // ===== اصلاح فیلتر ساعت برای select =====
    if (timeSelect) {
        var timeValue = timeSelect.value;
        if (timeValue === 'all' || timeValue === '') {
            this.filters.time = '';
        } else {
            this.filters.time = timeValue;
        }
    }
    
    if (roomInput) this.filters.room = roomInput.value.toLowerCase();
    this.renderSchedule();
};

SchedulingSystem.prototype.resetFilters = function() {
    var courseInput = document.getElementById('filterCourse');
    var teacherInput = document.getElementById('filterTeacher');
    var daySelect = document.getElementById('filterDay');
    var timeSelect = document.getElementById('filterTime');  // تغییر به select
    var roomInput = document.getElementById('filterRoom');
    
    if (courseInput) courseInput.value = '';
    if (teacherInput) teacherInput.value = '';
    if (daySelect) daySelect.value = 'all';
    if (timeSelect) timeSelect.value = 'all';  // برگرداندن به 'all'
    if (roomInput) roomInput.value = '';
    
    this.filters = { course: '', teacher: '', day: 'all', time: '', room: '' };
    this.renderSchedule();
};

// ============================================
// رندرینگ
// ============================================

SchedulingSystem.prototype.renderAll = function() {
    this.renderStats();
    this.renderSchedule();
    this.renderRoomsList();
    this.renderCoursesList();
};

SchedulingSystem.prototype.renderStats = function() {
    var totalRooms = this.rooms.length;
    var totalCourses = this.courses.length;
    var totalStudents = 0;
    for (var i = 0; i < this.courses.length; i++) {
        totalStudents += this.courses[i].studentCount;
    }
    var scheduled = this.schedule.length;
    
    this.updateElement('totalClasses', totalRooms);
    this.updateElement('totalStudents', totalStudents);
    this.updateElement('totalCourses', totalCourses);
    this.updateElement('scheduledCount', scheduled);
    this.updateElement('totalClassesInfo', totalRooms);
    this.updateElement('totalCoursesInfo', totalCourses);
    this.updateElement('totalStudentsInfo', totalStudents);
    this.updateElement('scheduledCountInfo', scheduled);
    
    var info = document.getElementById('capacityInfo');
    if (info) {
        info.textContent = 'تعداد کلاس‌ها: ' + totalRooms + ' | تعداد درس‌ها: ' + totalCourses;
        if (totalRooms >= 40) {
            info.innerHTML += ' | ظرفیت کافی';
        } else {
            info.innerHTML += ' | به ' + (40 - totalRooms) + ' کلاس دیگر نیاز دارید';
        }
    }
};

SchedulingSystem.prototype.updateElement = function(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
};
SchedulingSystem.prototype.renderSchedule = function() {
    var container = document.getElementById('scheduleTable');
    if (!container) return;
    
    // ===== ساعت‌های پویا از درس‌ها =====
    var timeSlots = this.getTimeSlots();
    
    var filtered = [];
    for (var i = 0; i < this.schedule.length; i++) filtered.push(this.schedule[i]);
    
    // ===== فیلتر ساعت (برای select) =====
    if (this.filters.time) {
    var temp = [];
    for (var i = 0; i < filtered.length; i++) {
        // مقایسه دقیق با مقدار انتخاب شده
        if (filtered[i].timeSlot === this.filters.time) {
            temp.push(filtered[i]);
           }
        }
        filtered = temp;
    }
    
    if (this.filters.time) {
        var temp = [];
        for (var i = 0; i < filtered.length; i++) {
            if (filtered[i].timeSlot && filtered[i].timeSlot.toLowerCase().includes(this.filters.time)) {
                temp.push(filtered[i]);
            }
        }
        filtered = temp;
    }
    
    if (this.filters.course || this.filters.teacher || this.filters.room) {
        var temp = [];
        for (var i = 0; i < filtered.length; i++) {
            var course = null;
            for (var j = 0; j < this.courses.length; j++) {
                if (this.courses[j].id === filtered[i].courseId) { course = this.courses[j]; break; }
            }
            if (!course) continue;
            var match = true;
            if (this.filters.course && !course.name.toLowerCase().includes(this.filters.course)) match = false;
            if (this.filters.teacher && !course.teacher.toLowerCase().includes(this.filters.teacher)) match = false;
            if (this.filters.room && filtered[i].roomName && !filtered[i].roomName.toLowerCase().includes(this.filters.room)) match = false;
            if (match) temp.push(filtered[i]);
        }
        filtered = temp;
    }
    
    var countEl = document.getElementById('filterCount');
    if (countEl) countEl.textContent = filtered.length + ' نتیجه';
    
    // ===== ساخت جدول با ساعت‌های پویا =====
    var html = '<table class="schedule-table">';
    html += '<thead><tr><th>زمان</th>';
    for (var d = 0; d < this.days.length; d++) {
        var day = this.days[d];
        var active = (this.filters.day === 'all' || this.filters.day === day);
        html += '<th style="' + (active ? '' : 'opacity:0.5;') + '">' + day + '</th>';
    }
    html += '</tr></thead><tbody>';
    
    if (timeSlots.length === 0) {
        html += '<tr><td colspan="' + (this.days.length + 1) + '" style="text-align:center;padding:30px;color:#999;">هیچ ساعتی ثبت نشده است</td></tr>';
    } else {
        for (var t = 0; t < timeSlots.length; t++) {
            var time = timeSlots[t];
            html += '<tr><td class="time-label">' + time + '</td>';
            for (var d2 = 0; d2 < this.days.length; d2++) {
                var dayName = this.days[d2];
                var items = [];
                for (var s = 0; s < filtered.length; s++) {
                    if (filtered[s].day === dayName && filtered[s].timeSlot === time) items.push(filtered[s]);
                }
                if (items.length > 0) {
                    html += '<td class="schedule-cell class">';
                    for (var itemIdx = 0; itemIdx < items.length; itemIdx++) {
                        var item = items[itemIdx];
                        var course = null;
                        for (var c = 0; c < this.courses.length; c++) {
                            if (this.courses[c].id === item.courseId) { course = this.courses[c]; break; }
                        }
                        if (course) {
                            html += '<div class="schedule-item">';
                            html += '<span class="course-name">' + course.name + '</span>';
                            html += '<span class="course-meta">استاد: ' + course.teacher + '</span>';
                            html += '<span class="course-meta">دانشجویان: ' + course.studentCount + ' نفر</span>';
                            html += '<span class="course-meta">کلاس: ' + (item.roomName || 'نامشخص') + '</span>';
                            html += '</div>';
                        }
                    }
                    html += '</td>';
                } else {
                    html += '<td class="schedule-cell empty"></td>';
                }
            }
            html += '</tr>';
        }
    }
    
    html += '</tbody></table>';
    
    if (this.schedule.length === 0) {
        html = '<div class="empty-state">هیچ برنامه‌ای ثبت نشده است</div>';
    } else if (filtered.length === 0) {
        html = '<div class="empty-state">نتیجه‌ای پیدا نشد</div>';
    }
    container.innerHTML = html;
};

SchedulingSystem.prototype.renderRoomsList = function() {
    var container = document.getElementById('roomList');
    if (!container) return;
    if (this.rooms.length === 0) {
        container.innerHTML = '<p class="empty-text">هیچ کلاسی ثبت نشده است.</p>';
        return;
    }
    var html = '';
    for (var i = 0; i < this.rooms.length; i++) {
        var room = this.rooms[i];
        html += '<div class="room-item">';
        html += '<div class="room-info">';
        html += '<span class="room-name">' + room.name + '</span>';
        html += '<span class="room-capacity">ظرفیت: ' + room.capacity + '</span>';
        html += '</div>';
        html += '<button onclick="system.deleteRoom(' + room.id + ')" class="btn btn-danger btn-sm">حذف</button>';
        html += '</div>';
    }
    container.innerHTML = html;
};

SchedulingSystem.prototype.renderCoursesList = function() {
    var container = document.getElementById('coursesList');
    if (!container) return;
    if (this.courses.length === 0) {
        container.innerHTML = '<p class="empty-text">هیچ درسی ثبت نشده است.</p>';
        return;
    }
    var html = '';
    for (var i = 0; i < this.courses.length; i++) {
        var course = this.courses[i];
        var scheduled = (course.roomId !== null && course.roomId !== undefined);
        var teacherName = course.teacher || 'نامشخص';
        
        html += '<div class="class-item">';
        html += '<div class="info">';
        html += '<span class="name">' + course.name + '</span>';
        html += '<span class="detail">استاد: ' + teacherName + '</span>';
        html += '<span class="detail">دانشجویان: ' + course.studentCount + '</span>';
        html += '<span class="detail">' + course.day + ' - ' + course.time + '</span>';
        html += '<span class="detail">کلاس: ' + (course.roomName || 'زمان‌بندی نشده') + '</span>';
        if (scheduled) {
            html += ' <span class="badge badge-success">زمان‌بندی شده</span>';
        } else {
            html += ' <span class="badge badge-warning">زمان‌بندی نشده</span>';
        }
        html += '</div>';
        html += '<div class="actions">';
        
        if (scheduled) {
            html += '<button onclick="system.showChangeRoomModal(' + course.id + ')" class="btn btn-primary btn-sm" style="background:#ff9800;border-color:#ff9800;">تغییر کلاس</button>';
        }
        
        html += '<button onclick="system.deleteCourse(' + course.id + ')" class="btn btn-danger btn-sm">حذف</button>';
        html += '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
};

// ============================================
// پیام‌ها
// ============================================

SchedulingSystem.prototype.showStatus = function(message, type, container) {
    if (!container) container = document.getElementById('scheduleStatus');
    if (!container) return;
    container.textContent = message;
    container.className = 'status-message show ' + (type || 'info');
    container.style.display = 'block';
};
SchedulingSystem.prototype.showNotif = function(message, type) {
    var existing = document.querySelectorAll('.notification');
    for (var i = 0; i < existing.length; i++) existing[i].remove();
    var div = document.createElement('div');
    div.className = 'notification alert-' + (type || 'success');
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(function() {
        div.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(function() { div.remove(); }, 300);
    }, 4000);
};

// ============================================
// آپلود اکسل
// ============================================

SchedulingSystem.prototype.importRoomsFromExcelFile = function() {
    var fileInput = document.getElementById('excelFile');
    if (!fileInput.files || fileInput.files.length === 0) {
        this.showImportStatus('لطفاً یک فایل انتخاب کنید.', 'error');
        return;
    }
    
    var file = fileInput.files[0];
    var reader = new FileReader();
    var self = this;
    
    reader.onload = function(e) {
        try {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });
            var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            var json = XLSX.utils.sheet_to_json(firstSheet);
            
            if (json.length === 0) {
                self.showImportStatus('فایل خالی است.', 'error');
                return;
            }
            
            var added = 0;
            var errorCount = 0;
            
            for (var i = 0; i < json.length; i++) {
                var row = json[i];
                var name = row['نام کلاس'] || row['کلاس'] || row['شماره کلاس'] || row['room'] || row['name'] || '';
                var capacity = parseInt(row['ظرفیت'] || row['ظرفیت کلاس'] || row['cap'] || row['capacity'] || 0);
                name = String(name).trim();
                if (!name) { errorCount++; continue; }
                if (!capacity || isNaN(capacity) || capacity < 1) { errorCount++; continue; }
                var exists = false;
                for (var j = 0; j < self.rooms.length; j++) {
                    if (self.rooms[j].name === name) { exists = true; break; }
                }
                if (!exists) {
                    self.rooms.push({ id: Date.now() + added + i, name: name, capacity: capacity });
                    added++;
                }
            }
            
            self.saveData();
            self.renderAll();
            
            var msg = added + ' کلاس با موفقیت اضافه شد.';
            if (errorCount > 0) {
                msg += ' ' + errorCount + ' رکورد نامعتبر بود.';
            }
            self.showImportStatus(msg, added > 0 ? 'success' : 'warning');
            fileInput.value = '';
        } catch (error) {
            console.error('خطا:', error);
            self.showImportStatus('خطا در خواندن فایل: ' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        self.showImportStatus('خطا در خواندن فایل.', 'error');
    };
    
    reader.readAsArrayBuffer(file);
};

SchedulingSystem.prototype.importCoursesFromExcelFile = function() {
    var fileInput = document.getElementById('excelCoursesFile');
    if (!fileInput.files || fileInput.files.length === 0) {
        this.showImportCoursesStatus('لطفاً یک فایل انتخاب کنید.', 'error');
        return;
    }
    
    var file = fileInput.files[0];
    var reader = new FileReader();
    var self = this;
    
    reader.onload = function(e) {
        try {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });
            var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            var json = XLSX.utils.sheet_to_json(firstSheet);
            if (json.length === 0) {
                self.showImportCoursesStatus('فایل خالی است.', 'error');
                return;
            }
            
            var added = 0;
            var errorCount = 0;
            var errors = [];
            
            for (var i = 0; i < json.length; i++) {
                var row = json[i];
                
                var name = row['نام درس'] || row['درس'] || row['عنوان درس'] || row['course'] || row['name'] || '';
                var teacher = row['استاد'] || row['نام استاد'] || row['teacher'] || row['Teacher'] || '';
                var count = parseInt(row['تعداد دانشجویان'] || row['دانشجو'] || row['student'] || row['students'] || 0);
                var day = row['روز'] || row['روز هفته'] || row['day'] || '';
                var time = row['ساعت'] || row['زمان'] || row['time'] || row['ساعت شروع'] || '';
                
                name = String(name).trim();
                teacher = String(teacher).trim();
                day = String(day).trim();
                time = String(time).trim();
                
                if (!name) { errorCount++; errors.push('ردیف ' + (i+1) + ': نام درس خالی'); continue; }
                if (!teacher) { errorCount++; errors.push('ردیف ' + (i+1) + ': نام استاد خالی'); continue; }
                if (!count || isNaN(count) || count < 1) { errorCount++; errors.push('ردیف ' + (i+1) + ': تعداد دانشجویان نامعتبر'); continue; }
                if (!day) { errorCount++; errors.push('ردیف ' + (i+1) + ': روز خالی'); continue; }
                if (!time) { errorCount++; errors.push('ردیف ' + (i+1) + ': ساعت خالی'); continue; }
                
                var validDay = false;
                for (var d = 0; d < self.days.length; d++) {
                    if (self.days[d] === day) { validDay = true; break; }
                }
                if (!validDay) { errorCount++; errors.push('ردیف ' + (i+1) + ': روز "' + day + '" معتبر نیست'); continue; }
                
                var room = self.findBestRoom(count, day, time);
                if (!room) {
                    errorCount++;
                    errors.push('ردیف ' + (i+1) + ': کلاس مناسب برای ' + count + ' دانشجو پیدا نشد');
                    continue;
                }
                
                var course = {
                    id: Date.now() + added + i,
                    name: name,
                    teacher: teacher,
                    studentCount: count,
                    day: day,
                    time: time,
                    roomId: room.id,
                    roomName: room.name
                };
                
                self.courses.push(course);
                self.schedule.push({
                    courseId: course.id,
                    day: day,
                    timeSlot: time,
                    roomId: room.id,
                    roomName: room.name
                });
                added++;
            }
            
            self.saveData();
            self.renderAll();
            
            var msg = added + ' درس با موفقیت اضافه شد.';
            if (errorCount > 0) {
                msg += ' ' + errorCount + ' رکورد نامعتبر بود.';
                console.log('❌ خطاها:', errors);
            }
            
            self.showImportCoursesStatus(msg, added > 0 ? 'success' : 'warning');
            fileInput.value = '';
        } catch (error) {
            console.error('❌ خطا:', error);
            self.showImportCoursesStatus('خطا در خواندن فایل: ' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        self.showImportCoursesStatus('خطا در خواندن فایل.', 'error');
    };
    
    reader.readAsArrayBuffer(file);
};

SchedulingSystem.prototype.downloadSampleExcel = function(type) {
    var data = [];
    var filename = '';
    
    if (type === 'rooms') {
        data = [
            { 'نام کلاس': '۱۰۱', 'ظرفیت': '۴۰' },
            { 'نام کلاس': '۱۰۲', 'ظرفیت': '۳۵' },
            { 'نام کلاس': '۱۰۳', 'ظرفیت': '۵۰' }
        ];
        filename = 'نمونه_کلاس‌ها.xlsx';
    } else {
        data = [
            { 'نام درس': 'ریاضی ۱', 'استاد': 'دکتر احمدی', 'تعداد دانشجویان': '۳۵', 'روز': 'شنبه', 'ساعت': '08:00-10:00' },
            { 'نام درس': 'فیزیک ۱', 'استاد': 'دکتر کریمی', 'تعداد دانشجویان': '۴۰', 'روز': 'شنبه', 'ساعت': '10:00-14:00' }
        ];
        filename = 'نمونه_درس‌ها.xlsx';
    }
    
    try {
        var ws = XLSX.utils.json_to_sheet(data);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, filename);
        this.showNotif('فایل نمونه دانلود شد!');
    } catch (error) {
        this.showNotif('خطا در دانلود فایل.', 'error');
    }
};

SchedulingSystem.prototype.showImportStatus = function(message, type) {
    var el = document.getElementById('importStatus');
    if (el) {
        el.textContent = message;
        el.className = 'status-message show ' + (type || 'info');
        el.style.display = 'block';
    }
};

SchedulingSystem.prototype.showImportCoursesStatus = function(message, type) {
    var el = document.getElementById('importCoursesStatus');
    if (el) {
        el.textContent = message;
        el.className = 'status-message show ' + (type || 'info');
        el.style.display = 'block';
    }
};

// ============================================
// خروجی PDF با تاخیر برای رندر کامل
// ============================================

SchedulingSystem.prototype.exportToPDF = function() {
    // ===== تشخیص jsPDF =====
    var PDF = null;
    if (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF !== 'undefined') {
        PDF = window.jspdf.jsPDF;
    } else if (typeof window.jsPDF !== 'undefined') {
        PDF = window.jsPDF;
    } else if (typeof jsPDF !== 'undefined') {
        PDF = jsPDF;
    } else if (typeof jspdf !== 'undefined' && typeof jspdf.jsPDF !== 'undefined') {
        PDF = jspdf.jsPDF;
    } else if (typeof jspdf !== 'undefined' && typeof jspdf.default !== 'undefined') {
        PDF = jspdf.default;
    }
    
    if (typeof html2canvas === 'undefined') {
        this.showNotif('❌ کتابخانه html2canvas پیدا نشد!', 'error');
        return;
    }
    if (!PDF) {
        this.showNotif('❌ کتابخانه jsPDF پیدا نشد!', 'error');
        return;
    }
    
    var self = this;
    this.showNotif('⏳ در حال آماده‌سازی PDF...', 'info');
    
    // ===== آماده‌سازی نام فایل =====
    var hasFilter = this.filters.course || this.filters.teacher  
                this.filters.day !== 'all' || this.filters.time  
                this.filters.room;
    
    var filename = 'برنامه_کلاس‌ها';
    if (hasFilter) {
        var parts = [];
        if (this.filters.course) parts.push(this.filters.course);
        if (this.filters.teacher) parts.push(this.filters.teacher);
        if (this.filters.day !== 'all') parts.push(this.filters.day);
        if (this.filters.time) parts.push(this.filters.time);
        if (this.filters.room) parts.push('کلاس_' + this.filters.room);
        filename += '_' + parts.join('_');
    }
    filename += '_' + new Date().toLocaleDateString('fa-IR') + '.pdf';
    
    // ===== گرفتن داده‌های فیلتر شده =====
    var filteredSchedule = [];
    for (var i = 0; i < this.schedule.length; i++) {
        filteredSchedule.push(this.schedule[i]);
    }
    
    if (this.filters.day !== 'all') {
        var temp = [];
        for (var i = 0; i < filteredSchedule.length; i++) {
            if (filteredSchedule[i].day === this.filters.day) temp.push(filteredSchedule[i]);
        }
        filteredSchedule = temp;
    }
    
    if (this.filters.time) {
        var temp = [];
        for (var i = 0; i < filteredSchedule.length; i++) {
            if (filteredSchedule[i].timeSlot && filteredSchedule[i].timeSlot.toLowerCase().includes(this.filters.time)) {
                temp.push(filteredSchedule[i]);
            }
        }
        filteredSchedule = temp;
    }
    
    if (this.filters.course || this.filters.teacher || this.filters.room) {
        var temp = [];
        for (var i = 0; i < filteredSchedule.length; i++) {
            var course = null;
            for (var j = 0; j < this.courses.length; j++) {
                if (this.courses[j].id === filteredSchedule[i].courseId) { course = this.courses[j]; break; }
            }
            if (!course) continue;
            var match = true;
            if (this.filters.course && !course.name.toLowerCase().includes(this.filters.course)) match = false;
            if (this.filters.teacher && !course.teacher.toLowerCase().includes(this.filters.teacher)) match = false;
            if (this.filters.room && filteredSchedule[i].roomName && !filteredSchedule[i].roomName.toLowerCase().includes(this.filters.room)) match = false;
            if (match) temp.push(filteredSchedule[i]);
        }
        filteredSchedule = temp;
    }
    
    // ===== گرفتن ساعت‌ها از filteredSchedule =====
    var timeSlots = [];
    for (var i = 0; i < filteredSchedule.length; i++) {
        var time = filteredSchedule[i].timeSlot;
        if (time && timeSlots.indexOf(time) === -1) {
            timeSlots.push(time);
        }
    }
    
    // اگه هیچ ساعتی در filteredSchedule نبود، از همه schedule بگیر
    if (timeSlots.length === 0) {
        for (var i = 0; i < this.schedule.length; i++) {
            var time = this.schedule[i].timeSlot;
            if (time && timeSlots.indexOf(time) === -1) {
                timeSlots.push(time);
            }
        }
    }
    
    // اگه باز هم هیچی نبود، از courses بگیر
    if (timeSlots.length === 0) {
        for (var i = 0; i < this.courses.length; i++) {
            var time = this.courses[i].time;
            if (time && timeSlots.indexOf(time) === -1) {
                timeSlots.push(time);
            }
        }
    }
    
    // مرتب‌سازی ساعت‌ها
    timeSlots.sort(function(a, b) {
        var hourA = parseInt(a.split(':')[0]);
        var hourB = parseInt(b.split(':')[0]);
        return hourA - hourB;
    });
    
    // ===== ساخت جدول HTML برای PDF با ساعت‌ها =====
    var tableHtml = '<table style="width:100%;direction:rtl;border-collapse:collapse;font-family:Tahoma,Arial,sans-serif;font-size:13px;">';
    
    // هدر جدول (روزها)
    tableHtml += '<thead><tr>';
    tableHtml += '<th style="border:1px solid #333;padding:10px 12px;text-align:center;background:#2c3e50;color:white;font-weight:bold;font-size:14px;">زمان</th>';
    for (var d = 0; d < this.days.length; d++) {
        var day = this.days[d];
        tableHtml += '<th style="border:1px solid #333;padding:10px 12px;text-align:center;background:#2c3e50;color:white;font-weight:bold;font-size:14px;">' + day + '</th>';
    }
    tableHtml += '</tr></thead>';
    
    // بدنه جدول
    tableHtml += '<tbody>';
    
    if (timeSlots.length === 0) {
        tableHtml += '<tr><td colspan="' + (this.days.length + 1) + '" style="text-align:center;padding:40px;border:1px solid #333;font-size:16px;color:#999;">هیچ ساعتی ثبت نشده است</td></tr>';
    } else {
        for (var t = 0; t < timeSlots.length; t++) {
            var time = timeSlots[t];
            
            // سطر ساعت
            tableHtml += '<tr>';
            tableHtml += '<td style="border:1px solid #333;padding:10px 12px;text-align:center;background:#ecf0f1;font-weight:bold;font-size:13px;">' + time + '</td>';
            
            for (var d2 = 0; d2 < this.days.length; d2++) {
                var dayName = this.days[d2];
                
                // پیدا کردن درس‌های این روز و ساعت
                var items = [];
                for (var s = 0; s < filteredSchedule.length; s++) {
                    if (filteredSchedule[s].day === dayName && filteredSchedule[s].timeSlot === time) {
                        items.push(filteredSchedule[s]);
                    }
                }
                
                if (items.length > 0) {
                    tableHtml += '<td style="border:1px solid #333;padding:8px 10px;text-align:center;background:#dff9fb;vertical-align:middle;">';
                    for (var itemIdx = 0; itemIdx < items.length; itemIdx++) {
                        var item = items[itemIdx];
                        var course = null;
                        for (var c = 0; c < this.courses.length; c++) {
                            if (this.courses[c].id === item.courseId) { course = this.courses[c]; break; }
                        }
                        if (course) {
                            tableHtml += '<div style="margin-bottom:5px;padding:4px;border-bottom:1px dashed #b3d9f7;">';
                            tableHtml += '<div style="font-weight:bold;font-size:14px;color:#1a237e;">' + course.name + '</div>';
                            tableHtml += '<div style="font-size:12px;color:#555;">استاد: ' + course.teacher + '</div>';
                            tableHtml += '<div style="font-size:12px;color:#555;">دانشجویان: ' + course.studentCount + ' نفر</div>';
                            tableHtml += '<div style="font-size:12px;color:#555;">کلاس: ' + (item.roomName || 'نامشخص') + '</div>';
                            tableHtml += '</div>';
                        }
                    }
                    tableHtml += '</td>';
                } else {
                    tableHtml += '<td style="border:1px solid #333;padding:8px 10px;text-align:center;background:#f9f9f9;"></td>';
                }
            }
            tableHtml += '</tr>';
        }
    }
    
    tableHtml += '</tbody></table>';
    
    // ===== ساخت wrapper =====
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;width:1100px;background:white;padding:30px;direction:rtl;font-family:Tahoma,Arial,sans-serif;';
    
    // عنوان
    var title = document.createElement('h2');
    title.style.cssText = 'text-align:center;margin-bottom:10px;color:#2c3e50;font-size:24px;';
    title.textContent = '📋 برنامه هفتگی کلاس‌ها';
    wrapper.appendChild(title);
    
    // تاریخ
    var dateInfo = document.createElement('p');
    dateInfo.style.cssText = 'text-align:center;margin-bottom:10px;color:#666;font-size:14px;';
    dateInfo.textContent = 'تاریخ: ' + new Date().toLocaleDateString('fa-IR');
    wrapper.appendChild(dateInfo);
    
    // فیلترها
    if (hasFilter) {
        var filterInfo = document.createElement('p');
        filterInfo.style.cssText = 'text-align:center;margin-bottom:15px;color:#3498db;font-size:13px;';
        var filterText = 'فیلترها: ';
        if (this.filters.course) filterText += 'درس: ' + this.filters.course + ' | ';
        if (this.filters.teacher) filterText += 'استاد: ' + this.filters.teacher + ' | ';
        if (this.filters.day !== 'all') filterText += 'روز: ' + this.filters.day + ' | ';
        if (this.filters.time) filterText += 'ساعت: ' + this.filters.time + ' | ';
        if (this.filters.room) filterText += 'کلاس: ' + this.filters.room;
        filterInfo.textContent = filterText;
        wrapper.appendChild(filterInfo);
    }
    
    // اضافه کردن جدول به wrapper
    wrapper.innerHTML += tableHtml;
    
    document.body.appendChild(wrapper);
    
    // ===== گرفتن عکس و ساخت PDF =====
    setTimeout(function() {
        html2canvas(wrapper, {
            scale: 2.5,
            useCORS: true,
            logging: false,
            width: 1100,
            height: wrapper.scrollHeight || 1500
        }).then(function(canvas) {
            var imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            var pdf = new PDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a2'
            });
            
            var pdfWidth = pdf.internal.pageSize.getWidth();
            var pdfHeight = pdf.internal.pageSize.getHeight();
            
            var imgWidth = canvas.width;
            var imgHeight = canvas.height;
            var ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            var finalWidth = imgWidth * ratio;
            var finalHeight = imgHeight * ratio;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, finalWidth, finalHeight);
            pdf.save(filename);
            
            document.body.removeChild(wrapper);
            self.showNotif('✅ فایل PDF با کیفیت بالا ایجاد شد!');
        }).catch(function(err) {
            console.error('خطا:', err);
            document.body.removeChild(wrapper);
            self.showNotif('❌ خطا در ایجاد PDF: ' + err.message, 'error');
        });
    }, 1500);
};
    

// ============================================
// راه‌اندازی
// ============================================

SchedulingSystem.prototype.clearAllCourses = function() {
    if (!confirm('⚠️ آیا از پاک کردن همه درس‌ها و برنامه زمان‌بندی مطمئن هستید؟\n\nاین کار قابل بازگشت نیست!')) {
        return;
    }
    
    if (!confirm('‼️ تأیید نهایی: آیا مطمئن هستید که می‌خواهید همه درس‌ها را حذف کنید؟')) {
        return;
    }
    
    // ===== پاک کردن درس‌ها، برنامه و کلاس‌ها =====
    this.courses = [];
    this.schedule = [];
    this.rooms = [];  // <--- این خط رو اضافه کنید
    
    this.saveData();
    this.renderAll();
    
    var statusEl = document.getElementById('clearStatus');
    if (statusEl) {
        statusEl.textContent = '✅ همه کلاس‌ها، درس‌ها و برنامه زمان‌بندی با موفقیت پاک شدند!';
        statusEl.className = 'status-message show success';
        statusEl.style.display = 'block';
    }
    
    this.showNotif('🗑️ همه کلاس‌ها، درس‌ها و برنامه پاک شدند!');
};

SchedulingSystem.prototype.backupData = function() {
    try {
        // ===== گرفتن همه داده‌ها =====
        var data = {
            rooms: this.rooms,
            courses: this.courses,
            schedule: this.schedule,
            backupDate: new Date().toISOString(),
            version: '1.0'
        };
        
        // ===== تبدیل به JSON =====
        var jsonData = JSON.stringify(data, null, 2);
        var blob = new Blob([jsonData], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        
        // ===== دانلود فایل =====
        var a = document.createElement('a');
        a.href = url;
        var dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
        a.download = 'پشتیبان_برنامه_' + dateStr + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // ===== نمایش پیام =====
        var statusEl = document.getElementById('backupStatus');
        if (statusEl) {
            statusEl.textContent = '✅ پشتیبان با موفقیت ذخیره شد! تاریخ: ' + new Date().toLocaleDateString('fa-IR');
            statusEl.className = 'status-message show success';
            statusEl.style.display = 'block';
        }
        this.showNotif('📥 فایل پشتیبان با موفقیت دانلود شد!');
    } catch (error) {
        console.error('خطا در پشتیبان‌گیری:', error);
        this.showNotif('❌ خطا در گرفتن پشتیبان', 'error');
    }
};

SchedulingSystem.prototype.restoreBackup = function() {
    try {
        // ===== ایجاد input مخفی برای انتخاب فایل =====
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        var self = this;
        
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) {
                self.showNotif('⚠️ هیچ فایلی انتخاب نشد!', 'warning');
                return;
            }
            
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    // ===== خواندن و解析 فایل =====
                    var data = JSON.parse(e.target.result);
                    
                    // ===== اعتبارسنجی داده‌ها =====
                    if (!data.rooms || !data.courses || !data.schedule) {
                        self.showNotif('❌ فایل پشتیبان معتبر نیست!', 'error');
                        return;
                    }
                    
                    // ===== تأیید از کاربر =====
                    if (!confirm('⚠️ آیا از بازیابی این پشتیبان مطمئن هستید؟\n\nداده‌های فعلی کاملاً جایگزین خواهند شد!')) {
                        return;
                    }
                    
                    // ===== جایگزینی داده‌ها =====
                    self.rooms = data.rooms || [];
                    self.courses = data.courses || [];
                    self.schedule = data.schedule || [];
                    
                    // ===== ذخیره و به‌روزرسانی =====
                    self.saveData();
                    self.renderAll();
                    
                    var statusEl = document.getElementById('backupStatus');
                    if (statusEl) {
                        var dateStr = data.backupDate ? new Date(data.backupDate).toLocaleDateString('fa-IR') : 'نامشخص';
                        statusEl.textContent = '✅ پشتیبان با موفقیت بازیابی شد! تاریخ پشتیبان: ' + dateStr;
                        statusEl.className = 'status-message show success';
                        statusEl.style.display = 'block';
                    }
                    self.showNotif('✅ پشتیبان با موفقیت بازیابی شد!');
                } catch (error) {
                    console.error('خطا در خواندن فایل:', error);
                    self.showNotif('❌ خطا در خواندن فایل پشتیبان: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    } catch (error) {
        console.error('خطا در بازیابی:', error);
        this.showNotif('❌ خطا در بازیابی پشتیبان', 'error');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    system = new SchedulingSystem();
    console.log('سیستم راه‌اندازی شد!');
});

window.system = system;