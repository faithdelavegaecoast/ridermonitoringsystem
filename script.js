let riderNames =
JSON.parse(localStorage.getItem("riderNames")) || [];

let records =
JSON.parse(localStorage.getItem("riderRecords")) || [];

let schedules =
JSON.parse(localStorage.getItem("riderSchedules")) || [];

let currentPage = 1;
const rowsPerPage = 10;

let assignDate = new Date();
let viewDate = new Date();

function saveData(){
localStorage.setItem("riderNames", JSON.stringify(riderNames));
localStorage.setItem("riderRecords", JSON.stringify(records));
localStorage.setItem("riderSchedules", JSON.stringify(schedules));
}

function loadDropdowns(){
const dropdowns = [
document.getElementById("manageRider"),
document.getElementById("recordRider"),
document.getElementById("scheduleRider")
];

dropdowns.forEach(select=>{
select.innerHTML = '<option value="">Choose Rider</option>';
riderNames.forEach(name=>{
select.innerHTML += `<option value="${name}">${name}</option>`;
});
});
}

function addRider(){
const name = document.getElementById("newRiderName").value.trim();
if(name==="") return;
if(riderNames.includes(name)){
alert("Rider already exists");
return;
}
riderNames.push(name);
saveData();
loadDropdowns();
document.getElementById("newRiderName").value="";
}

function editRider(){
const selected = document.getElementById("manageRider").value;
if(selected==="") return;

const updated = prompt("Edit rider name", selected);
if(!updated) return;

riderNames = riderNames.map(r=>r===selected?updated:r);

records.forEach(r=>{
if(r.name===selected) r.name = updated;
});

schedules.forEach(s=>{
if(s.name===selected) s.name = updated;
});

saveData();
loadDropdowns();
renderTable();
}

function deleteRider(){
const selected = document.getElementById("manageRider").value;
if(selected==="") return;

if(confirm("Delete rider?")){
riderNames = riderNames.filter(r=>r!==selected);
records = records.filter(r=>r.name!==selected);
schedules = schedules.filter(r=>r.name!==selected);
saveData();
loadDropdowns();
renderTable();
}
}

function detectDay(){
const value = document.getElementById("recordDate").value;
const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
document.getElementById("recordDay").value =
days[new Date(value).getDay()];
}

function calculateHours(timeIn,timeOut,breakTime){
let start = new Date(`2000-01-01 ${timeIn}`);
let end = new Date(`2000-01-01 ${timeOut}`);
let diff = (end-start)/(1000*60*60);
return (diff - ((breakTime||0)/60)).toFixed(2);
}

function addRecord(){
const name = document.getElementById("recordRider").value;
const date = document.getElementById("recordDate").value;
const day = document.getElementById("recordDay").value;
const timeIn = document.getElementById("timeIn").value;
const timeOut = document.getElementById("timeOut").value;
const breakTime = document.getElementById("breakTime").value || 0;

if(name==="" || date===""){
alert("Complete all fields");
return;
}

records.push({
id:Date.now(),
name,
date,
day,
timeIn,
timeOut,
breakTime,
hours: calculateHours(timeIn,timeOut,breakTime)
});

saveData();
renderTable();
renderViewCalendar();
}

function initializeCalendars(){
const rider = document.getElementById("scheduleRider").value;
document.getElementById("calendarWrapper").style.display = rider ? "flex":"none";
renderAssignCalendar();
renderViewCalendar();
}

function renderAssignCalendar(){
renderCalendar("assignCalendar",assignDate,true);
document.getElementById("assignMonthYear").innerText =
assignDate.toLocaleString('default',{month:'long',year:'numeric'});
}

function renderViewCalendar(){
renderCalendar("viewCalendar",viewDate,false);
document.getElementById("viewMonthYear").innerText =
viewDate.toLocaleString('default',{month:'long',year:'numeric'});
}

function renderCalendar(elementId,dateObj,isAssign){

const rider = document.getElementById("scheduleRider").value;
const calendar = document.getElementById(elementId);

calendar.innerHTML = "";

const month = dateObj.getMonth();
const year = dateObj.getFullYear();

const firstDay = new Date(year,month,1).getDay();
const daysInMonth = new Date(year,month+1,0).getDate();

const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

weekdays.forEach(d=>{
calendar.innerHTML += `<div style="font-weight:bold;text-align:center;padding:8px;background:#f0f0f0;border-radius:5px;">${d}</div>`;
});

for(let i=0;i<firstDay;i++){
calendar.innerHTML += `<div></div>`;
}

for(let i=1;i<=daysInMonth;i++){

const fullDate =
`${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;

const scheduled = schedules.some(s=>s.name===rider && s.date===fullDate);
const attended = records.some(r=>r.name===rider && r.date===fullDate);

let color="white";
let textColor="black";

if(isAssign){
color = scheduled ? "#87cefa":"white";
}else{
if(scheduled && attended){color="#4caf50";textColor="white";}
if(scheduled && !attended){color="#f44336";textColor="white";}
}

calendar.innerHTML += `
<div ${isAssign?`onclick="toggleSchedule('${fullDate}')"`:""}
style="padding:12px 5px;text-align:center;border-radius:5px;
border:1px solid #ddd;cursor:${isAssign?'pointer':'default'};
background:${color};color:${textColor};">
${i}
</div>`;
}
}

function toggleSchedule(date){
const rider = document.getElementById("scheduleRider").value;

const index = schedules.findIndex(s=>s.name===rider && s.date===date);

if(index>-1) schedules.splice(index,1);
else schedules.push({name:rider,date});

saveData();
renderAssignCalendar();
renderViewCalendar();
}

function prevAssignMonth(){assignDate.setMonth(assignDate.getMonth()-1);renderAssignCalendar();}
function nextAssignMonth(){assignDate.setMonth(assignDate.getMonth()+1);renderAssignCalendar();}
function prevViewMonth(){viewDate.setMonth(viewDate.getMonth()-1);renderViewCalendar();}
function nextViewMonth(){viewDate.setMonth(viewDate.getMonth()+1);renderViewCalendar();}

function getFilteredReport(type,date){

const target = new Date(date);

if(type==="daily"){
return records.filter(r=>r.date===date);
}

if(type==="weekly"){
const start = new Date(target);
start.setDate(target.getDate()-target.getDay());

const end = new Date(start);
end.setDate(start.getDate()+6);

return records.filter(r=>{
const d = new Date(r.date);
return d>=start && d<=end;
});
}

if(type==="monthly"){
return records.filter(r=>{
const d = new Date(r.date);
return d.getMonth()===target.getMonth() &&
d.getFullYear()===target.getFullYear();
});
}

return [];
}

function getAbsentCount(riderName,type,selectedDate){

const target = new Date(selectedDate);

let absent = 0;
let datesToCheck = [];

if(type==="daily") datesToCheck.push(selectedDate);

if(type==="weekly"){
const start = new Date(target);
start.setDate(target.getDate()-target.getDay());

for(let i=0;i<7;i++){
const d = new Date(start);
d.setDate(start.getDate()+i);
datesToCheck.push(d.toISOString().split("T")[0]);
}
}

if(type==="monthly"){
const year = target.getFullYear();
const month = target.getMonth();
const days = new Date(year,month+1,0).getDate();

for(let i=1;i<=days;i++){
datesToCheck.push(new Date(year,month,i).toISOString().split("T")[0]);
}
}

datesToCheck.forEach(date=>{
const checkDate = new Date(date);

const scheduled = schedules.some(s=>s.name===riderName && s.date===date);
const attended = records.some(r=>r.name===riderName && r.date===date);

if(scheduled && !attended && checkDate <= new Date()){
absent++;
}
});

return absent;
}

function generateReport(){

const type = document.getElementById("reportType").value;
const selectedDate = document.getElementById("reportDate").value;

if(selectedDate===""){
alert("Select a date");
return;
}

const filtered = getFilteredReport(type,selectedDate);

let summary = {};

riderNames.forEach(name=>{
summary[name]={hours:0,absent:0};

filtered.forEach(r=>{
if(r.name===name) summary[name].hours += Number(r.hours);
});

summary[name].absent = getAbsentCount(name,type,selectedDate);

const hasSchedule = schedules.some(s=>s.name===name && s.date===selectedDate);
const hasRecord = filtered.some(r=>r.name===name);

if(hasSchedule && !hasRecord){
summary[name].hours=0;
summary[name].absent=1;
}
});

let html = `
<table style="width:100%;border-collapse:collapse;">
<thead style="background:#007bff;color:white;">
<tr>
<th>Date</th>
<th>Name</th>
<th>Total Hours</th>
<th>Days Absent</th>
</tr>
</thead><tbody>
`;

riderNames.forEach(name=>{
html += `
<tr style="text-align:center;border-bottom:1px solid #ddd;">
<td>${selectedDate}</td>
<td>${name}</td>
<td>${summary[name].hours.toFixed(2)}</td>
<td>${summary[name].absent}</td>
</tr>`;
});

html += `</tbody></table>`;

document.getElementById("reportOutput").innerHTML = html;
}

function downloadReport(){

const type = document.getElementById("reportType").value;
const selectedDate = document.getElementById("reportDate").value;

if(selectedDate===""){
alert("Select a date");
return;
}

const filtered = getFilteredReport(type,selectedDate);

let summary = {};

riderNames.forEach(name=>{
summary[name]={hours:0,absent:0};

filtered.forEach(r=>{
if(r.name===name) summary[name].hours += Number(r.hours);
});

summary[name].absent = getAbsentCount(name,type,selectedDate);

const hasSchedule = schedules.some(s=>s.name===name && s.date===selectedDate);
const hasRecord = filtered.some(r=>r.name===name);

if(hasSchedule && !hasRecord){
summary[name].hours=0;
summary[name].absent=1;
}
});

let csv = [];

csv.push(["Date","Rider Name","Total Hours","Days Absent"].join(","));

riderNames.forEach(name=>{
csv.push([
`"${selectedDate}"`,
`"${name}"`,
`"${summary[name].hours.toFixed(2)}"`,
`"${summary[name].absent}"`
].join(","));
});

const blob = new Blob([csv.join("\n")],{type:"text/csv;charset=utf-8;"});

const link = document.createElement("a");
link.href = URL.createObjectURL(blob);
link.download = `${type}_report_${selectedDate}.csv`;

document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}

function renderTable(){

const search = document.getElementById("search").value.toLowerCase();
const body = document.getElementById("tableBody");

body.innerHTML = "";

const filtered = records
.filter(r=>r.name.toLowerCase().includes(search))
.sort((a,b)=>new Date(b.date)-new Date(a.date));

const start = (currentPage-1)*rowsPerPage;
const end = start+rowsPerPage;

filtered.slice(start,end).forEach(record=>{
body.innerHTML += `
<tr style="text-align:center;border-bottom:1px solid #ddd;">
<td>${record.name}</td>
<td>${record.date}</td>
<td>${record.day}</td>
<td>${record.timeIn}</td>
<td>${record.timeOut}</td>
<td>${record.breakTime}</td>
<td>${record.hours}</td>
<td><button onclick="deleteRecord(${record.id})"
style="background:red;color:white;border:none;padding:6px 10px;border-radius:4px;">Delete</button></td>
</tr>`;
});

setupPagination(filtered);
}

function setupPagination(data){
const pagination = document.getElementById("pagination");
pagination.innerHTML = "";

const pages = Math.ceil(data.length/rowsPerPage);

for(let i=1;i<=pages;i++){
pagination.innerHTML += `
<button onclick="changePage(${i})"
style="padding:8px 14px;border:none;border-radius:5px;
background:${currentPage===i?'#007bff':'#ddd'};
color:${currentPage===i?'white':'black'};">
${i}
</button>`;
}
}

function changePage(page){
currentPage = page;
renderTable();
}

function deleteRecord(id){
records = records.filter(r=>r.id!==id);
saveData();
renderTable();
renderViewCalendar();
}

loadDropdowns();
renderTable();
