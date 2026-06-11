let raceChart = null;

document
.getElementById("excelFile")
.addEventListener(
"change",
loadExcel
);

function loadExcel(event){

const file =
event.target.files[0];

if(!file) return;

const reader =
new FileReader();

reader.onload = function(e){

const workbook =
XLSX.read(
e.target.result,
{
type:"binary"
}
);

const sheet =
workbook.Sheets[
workbook.SheetNames[0]
];

const rows =
XLSX.utils.sheet_to_json(
sheet,
{
header:1,
defval:""
}
);

processData(rows);

};

reader.readAsBinaryString(file);

}

function processData(rows){

const participants =
getParticipants(rows);

const ranking =
calculateRanking(
rows,
participants
);

renderRanking(ranking);

renderMatches(rows);

renderProgress(rows);

renderRaceChart(
rows,
participants
);

}

function getParticipants(rows){

const participants=[];

for(
let col=6;
col<rows[0].length;
col+=2
){

const name =
String(
rows[0][col]||""
).trim();

if(name){

participants.push({
name,
local:col,
visitor:col+1
});

}

}

return participants;

}

function calculateRanking(
rows,
participants
){

const ranking =
participants.map(
p=>({
name:p.name,
points:0,
exacts:0,
hits:0
})
);

for(
let row=2;
row<rows.length;
row++
){

const rl =
Number(rows[row][4]);

const rv =
Number(rows[row][5]);

if(
isNaN(rl) ||
isNaN(rv)
){
continue;
}

participants.forEach(
(participant,index)=>{

const pl =
Number(
rows[row][participant.local]
);

const pv =
Number(
rows[row][participant.visitor]
);

if(
isNaN(pl) ||
isNaN(pv)
){
return;
}

const real =
Math.sign(
rl-rv
);

const pred =
Math.sign(
pl-pv
);

if(real===pred){

ranking[index].points++;

ranking[index].hits++;

}

if(
rl===pl &&
rv===pv
){

ranking[index].points+=3;

ranking[index].exacts++;

}

});

}

ranking.sort(
(a,b)=>
b.points-a.points
);

return ranking;

}

function renderRanking(ranking){

const tbody =
document.getElementById(
"rankingBody"
);

tbody.innerHTML="";

ranking.forEach(
(player,index)=>{

const tr =
document.createElement("tr");

if(index===0){
tr.classList.add(
"position1"
);
}

tr.innerHTML=`
<td>${index+1}</td>
<td>${player.name}</td>
<td>${player.points}</td>
<td>${player.exacts}</td>
<td>${player.hits}</td>
`;

tbody.appendChild(tr);

});

}

function renderMatches(rows){

const tbody =
document.getElementById(
"matchesBody"
);

tbody.innerHTML="";

for(
let i=2;
i<rows.length;
i++
){

const tr =
document.createElement("tr");

tr.innerHTML=`
<td>${rows[i][0]}</td>
<td>${rows[i][1]}</td>
<td>${rows[i][2]}</td>
<td>${rows[i][3]}</td>
<td>${rows[i][4] ?? "-"} - ${rows[i][5] ?? "-"}</td>
`;

tbody.appendChild(tr);

}

}

function renderProgress(rows){

const total =
rows.length-2;

let played=0;

for(
let i=2;
i<rows.length;
i++
){

if(
rows[i][4]!=="" &&
rows[i][5]!==""
){
played++;
}

}

const percent =
(
played/total
*100
).toFixed(1);

document.getElementById(
"playedValue"
).textContent =
`${played} / ${total}`;

document.getElementById(
"playedPercent"
).textContent =
`${percent}%`;

}

function renderRaceChart(
rows,
participants
){

const datasets=[];

participants.forEach(
participant=>{

let total=0;

const data=[];

for(
let row=2;
row<rows.length;
row++
){

const rl =
Number(rows[row][4]);

const rv =
Number(rows[row][5]);

if(
isNaN(rl) ||
isNaN(rv)
){
break;
}

const pl =
Number(
rows[row][participant.local]
);

const pv =
Number(
rows[row][participant.visitor]
);

if(
!isNaN(pl) &&
!isNaN(pv)
){

const real =
Math.sign(
rl-rv
);

const pred =
Math.sign(
pl-pv
);

if(real===pred){
total+=1;
}

if(
pl===rl &&
pv===rv
){
total+=3;
}

}

data.push(total);

}

datasets.push({
label:participant.name,
data:data,
tension:.25
});

});

const labels =
Array.from(
{
length:
Math.max(
...datasets.map(
d=>d.data.length
)
)
},
(_,i)=>i+1
);

if(raceChart){
raceChart.destroy();
}

raceChart =
new Chart(
document.getElementById(
"raceChart"
),
{
type:"line",
data:{
labels,
datasets
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{
position:"right"
}
}
}
}
);

}