// ============================================
// سامانه برنامه‌ریزی کلاس‌ها - نسخه نهایی
// ============================================

var system = null;

function SchedulingSystem() {
    this.rooms = [];
    this.courses = [];
    this.schedule = [];
    this.timeSlots = ['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00'];
    this.days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سهشنبه', 'چهارشنبه'];
    this.filters = { course: '', teacher: '', day: 'all', time: 'all', room: '' };
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
    var timeSelect = document.getElementById('courseTime');
    
    if (!nameInput || !teacherInput || !studentInput || !daySelect || !timeSelect) {
        this.showNotif('خطا در فرم! لطفاً صفحه را رفرش کنید.', 'error');
        return;
    }
    
    var name = nameInput.value.trim();
    var teacher = teacherInput.value.trim();
    var studentCount = parseInt(studentInput.value);
    var day = daySelect.value;
    var time = timeSelect.value;
    
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
        this.showNotif('لطفاً ساعت را انتخاب کنید.', 'error');
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
// برنامه‌ریزی کامل هفته
// ============================================

SchedulingSystem.prototype.planFullWeek = function() {
    var status = document.getElementById('fullWeekStatus');
    this.showStatus('در حال برنامه‌ریزی...', 'info', status);
    if (this.rooms.length < 40) {
        this.showStatus('به حداقل 40 کلاس نیاز دارید! (' + this.rooms.length + ' کلاس موجود)', 'error', status);
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
    var timeSelect = document.getElementById('filterTime');
    var roomInput = document.getElementById('filterRoom');
    
    if (courseInput) this.filters.course = courseInput.value.toLowerCase();
    if (teacherInput) this.filters.teacher = teacherInput.value.toLowerCase();
    if (daySelect) this.filters.day = daySelect.value;
    if (timeSelect) this.filters.time = timeSelect.value;
    if (roomInput) this.filters.room = roomInput.value.toLowerCase();
    this.renderSchedule();
};

SchedulingSystem.prototype.resetFilters = function() {
    var courseInput = document.getElementById('filterCourse');
    var teacherInput = document.getElementById('filterTeacher');
    var daySelect = document.getElementById('filterDay');
    var timeSelect = document.getElementById('filterTime');
    var roomInput = document.getElementById('filterRoom');
    
    if (courseInput) courseInput.value = '';
    if (teacherInput) teacherInput.value = '';
    if (daySelect) daySelect.value = 'all';
    if (timeSelect) timeSelect.value = 'all';
    if (roomInput) roomInput.value = '';
    
    this.filters = { course: '', teacher: '', day: 'all', time: 'all', room: '' };
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
    
    var filtered = [];
    for (var i = 0; i < this.schedule.length; i++) filtered.push(this.schedule[i]);
    
    if (this.filters.day !== 'all') {
        var temp = [];
        for (var i = 0; i < filtered.length; i++) {
            if (filtered[i].day === this.filters.day) temp.push(filtered[i]);
        }
        filtered = temp;
    }
    
    if (this.filters.time !== 'all') {
        var temp = [];
        for (var i = 0; i < filtered.length; i++) {
            if (filtered[i].timeSlot === this.filters.time) temp.push(filtered[i]);
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
            if (this.filters.course && !course.name.includes(this.filters.course)) match = false;
            if (this.filters.teacher && !course.teacher.includes(this.filters.teacher)) match = false;
            if (this.filters.room && filtered[i].roomName && !filtered[i].roomName.includes(this.filters.room)) match = false;
            if (match) temp.push(filtered[i]);
        }
        filtered = temp;
    }
    
    var countEl = document.getElementById('filterCount');
    if (countEl) countEl.textContent = filtered.length + ' نتیجه';
    
    var html = '<table class="schedule-table">';
    html += '<thead><tr><th>زمان</th>';
    for (var d = 0; d < this.days.length; d++) {
        var day = this.days[d];
        var active = (this.filters.day === 'all' || this.filters.day === day);
        html += '<th style="' + (active ? '' : 'opacity:0.5;') + '">' + day + '</th>';
    }
    html += '</tr></thead><tbody>';
    
    for (var t = 0; t < this.timeSlots.length; t++) {
        var time = this.timeSlots[t];
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
            
            console.log('📊 داده‌های کلاس:', json);
            console.log('📋 ستون‌ها:', Object.keys(json[0] || {}));
            
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
            
            console.log('📊 داده‌های درس:', json);
            console.log('📋 ستون‌ها:', Object.keys(json[0] || {}));
            
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
                var day = row['روز'] || row['روز هفته']|| row['day'] || '';
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
                
                var validTime = false;
                for (var t = 0; t < self.timeSlots.length; t++) {
                    if (self.timeSlots[t] === time) { validTime = true; break; }
                }
                if (!validTime) { errorCount++; errors.push('ردیف ' + (i+1) + ': ساعت "' + time + '" معتبر نیست'); continue; }
                
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
            { 'نام درس': 'فیزیک ۱', 'استاد': 'دکتر کریمی', 'تعداد دانشجویان': '۴۰', 'روز': 'شنبه', 'ساعت': '08:00-10:00' }
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
// خروجی PDF
// ============================================

SchedulingSystem.prototype.exportToPDF = function() {
    if (typeof html2pdf === 'undefined') {
        this.showNotif('لطفاً کتابخانه html2pdf را بارگذاری کنید.', 'error');
        return;
    }
    var element = document.getElementById('scheduleTable');
    if (!element) return;
    var opt = {
        margin: 10,
        filename: 'برنامه_کلاس‌ها_' + new Date().toLocaleDateString('fa-IR') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
    };
    html2pdf().from(element).set(opt).save();
    this.showNotif('فایل PDF با موفقیت ایجاد شد!');
};

// ============================================
// راه‌اندازی
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    system = new SchedulingSystem();
    console.log('سیستم راه‌اندازی شد!');
});

window.system = system;