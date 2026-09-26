// ================= AUTH =================
function goLogin(){ window.location = "login.html"; }
function goSignup(){ window.location = "signup.html"; }

function signup(){
  let name = document.getElementById("name")?.value;
  let email = document.getElementById("email")?.value;
  let pass = document.getElementById("password")?.value;

  if(!name || !email || !pass){
    alert("Fill all fields");
    return;
  }

  localStorage.setItem("user", JSON.stringify({name,email,pass}));
  alert("Signup successful!");
  window.location = "login.html";
}

function login(){
  let user = JSON.parse(localStorage.getItem("user"));
  let email = document.getElementById("email")?.value;
  let pass = document.getElementById("password")?.value;

  if(user && email === user.email && pass === user.pass){
    localStorage.setItem("loggedIn","true");
    window.location = "dashboard.html";
  } else alert("Invalid login");
}

function logout(){
  localStorage.removeItem("loggedIn");
  window.location = "login.html";
}

// ================= DARK MODE =================
function toggleDark(){
  document.body.classList.toggle("dark");
}

// ================= DASHBOARD =================
function loadDashboard(){
  let isLogged = localStorage.getItem("loggedIn");
  if(!isLogged) return window.location="login.html";

  let user = JSON.parse(localStorage.getItem("user"));
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let goals = JSON.parse(localStorage.getItem("goals")) || [];

  if(document.getElementById("welcome"))
    document.getElementById("welcome").innerText = "👋 Welcome, " + user.name;

  if(document.getElementById("date"))
    document.getElementById("date").innerText = new Date().toDateString();

  // stats
  document.getElementById("hours").innerText =
    tasks.reduce((a,b)=>a+(b.hours||0),0);

  document.getElementById("tasks").innerText =
    tasks.filter(t=>t.completed).length;

  document.getElementById("subjects").innerText =
    new Set(tasks.map(t=>t.subject)).size;

  // goals progress
  let doneGoals = goals.filter(g=>g.done).length;
  if(document.getElementById("goalsDone"))
    document.getElementById("goalsDone").innerText = doneGoals;

  // chart
  let ctx = document.getElementById("chart");
  if(ctx){
    let days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    let data = [0,0,0,0,0,0,0];

    tasks.forEach(t=>{
      if(t.date){
        let d = new Date(t.date).getDay();
        data[d] += t.hours || 0;
      }
    });

    if(window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx,{
      type:'line',
      data:{
        labels:days,
        datasets:[{
          label:"Study Hours",
          data:data,
          borderWidth:2
        }]
      }
    });
  }
}

// ================= ADD TASK =================
function addTask(){
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  let subject = document.getElementById("subject").value;
  let hours = Number(document.getElementById("hoursInput").value);
  let date = document.getElementById("taskDate").value;
  let priority = document.getElementById("priority")?.value || "Low";

  if(!subject || !hours || !date){
    alert("Fill all fields");
    return;
  }

  tasks.push({
    subject,
    hours,
    date,
    priority,
    completed:false
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));

  document.getElementById("subject").value="";
  document.getElementById("hoursInput").value="";

  loadTasks();
  loadWeekly();
  loadCalendar();
}

// ================= LOAD TASKS =================
function loadTasks(){
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let container = document.getElementById("taskList");
  if(!container) return;

  container.innerHTML="";

  tasks.forEach((t,i)=>{
    let div=document.createElement("div");
    div.className="task-item";

    div.innerHTML=`
      <div>
        <input type="checkbox" ${t.completed?"checked":""}
        onchange="toggleTask(${i})">

        <span style="${t.completed?'text-decoration:line-through':''}">
          ${t.subject} (${t.hours}h)
        </span>
      </div>

      <div>
        <button onclick="deleteTask(${i})">❌</button>
      </div>
    `;

    container.appendChild(div);
  });
}

// ================= TASK ACTIONS =================
function toggleTask(i){
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks[i].completed = !tasks[i].completed;
  localStorage.setItem("tasks", JSON.stringify(tasks));
  loadTasks();
  loadWeekly();
  loadCalendar();
}

function deleteTask(i){
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.splice(i,1);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  loadTasks();
  loadWeekly();
  loadCalendar();
}

// ================= WEEKLY =================
function loadWeekly(){
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let container = document.getElementById("weekGrid");
  if(!container) return;

  let days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  container.innerHTML="";

  days.forEach((day,index)=>{
    let box = document.createElement("div");
    box.className="week-day";

    let dayTasks = tasks.filter(t=>{
      return new Date(t.date).getDay() === index;
    });

    box.innerHTML = `<b>${day}</b><br>` +
      dayTasks.map(t=>t.subject).join("<br>");

    container.appendChild(box);
  });
}

// ================= TODAY =================
function loadCalendar(){
  let el = document.getElementById("calendar");
  if(!el) return;

  let today = new Date().toISOString().split("T")[0];
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  let todayTasks = tasks.filter(t=>t.date===today);

  el.innerHTML = `<b>${new Date().toDateString()}</b>`;

  if(todayTasks.length===0){
    el.innerHTML += "<p>No tasks today</p>";
  } else {
    todayTasks.forEach(t=>{
      el.innerHTML += `<p>${t.subject} (${t.hours}h)</p>`;
    });
  }
}

// ================= ANALYTICS =================
function loadAnalytics(){
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  let total = tasks.length;
  let done = tasks.filter(t=>t.completed).length;

  document.getElementById("totalTasks").innerText = total;
  document.getElementById("completedTasks").innerText = done;
  document.getElementById("completionRate").innerText =
    total ? Math.round((done/total)*100)+"%" : "0%";

  let ctx = document.getElementById("analyticsChart");
  if(!ctx) return;

  if(window.analyticsChartInstance)
    window.analyticsChartInstance.destroy();

  window.analyticsChartInstance = new Chart(ctx,{
    type:'doughnut',
    data:{
      labels:["Completed","Pending"],
      datasets:[{
        data:[done,total-done],
        backgroundColor:["#4caf50","#f44336"]
      }]
    },
    options:{ maintainAspectRatio:false }
  });
}

// ================= GOALS =================
function addGoal(){
  let goals = JSON.parse(localStorage.getItem("goals")) || [];
  let text = document.getElementById("goalInput").value;

  if(!text) return alert("Enter goal");

  goals.push({text,done:false});
  localStorage.setItem("goals", JSON.stringify(goals));
  document.getElementById("goalInput").value="";
  loadGoals();
}

function loadGoals(){
  let goals = JSON.parse(localStorage.getItem("goals")) || [];
  let container = document.getElementById("goalList");
  if(!container) return;

  container.innerHTML="";

  goals.forEach((g,i)=>{
    let div=document.createElement("div");
    div.className="task-item";

    div.innerHTML=`
      <span style="${g.done?'text-decoration:line-through':''}">
        ${g.text}
      </span>

      <div>
        <button onclick="toggleGoal(${i})">✔</button>
        <button onclick="deleteGoal(${i})">❌</button>
      </div>
    `;

    container.appendChild(div);
  });
}

function toggleGoal(i){
  let goals = JSON.parse(localStorage.getItem("goals")) || [];
  goals[i].done = !goals[i].done;
  localStorage.setItem("goals", JSON.stringify(goals));
  loadGoals();
}

function deleteGoal(i){
  let goals = JSON.parse(localStorage.getItem("goals")) || [];
  goals.splice(i,1);
  localStorage.setItem("goals", JSON.stringify(goals));
  loadGoals();
}

// ================= PROFILE =================
function loadProfile(){
  console.log("Profile loading...");

  let data = localStorage.getItem("user");

  if(!data){
    alert("User not found. Please login again.");
    window.location = "login.html";
    return;
  }

  let user = JSON.parse(data);

  let nameEl = document.getElementById("name");
  let emailEl = document.getElementById("email");

  if(nameEl) nameEl.innerText = user.name;
  if(emailEl) emailEl.innerText = user.email;
}

// ================= AI =================
function loadAI(){
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let box = document.getElementById("aiText");

  if(!box) return;

  if(tasks.length === 0){
    box.innerHTML = "📌 Add tasks to get smart insights.";
    return;
  }

  let msg = "";

  let pending = tasks.filter(t=>!t.completed);
  let completed = tasks.filter(t=>t.completed);

  // 🔴 Pending warning
  if(pending.length > 3){
    msg += "⚠️ You have many pending tasks. Focus on completing them first.<br><br>";
  }

  // 🟢 Motivation
  if(completed.length > 0){
    msg += "✅ Good progress! Keep it up.<br><br>";
  }

  // 📊 Subject analysis
  let subjectStats = {};

  tasks.forEach(t=>{
    subjectStats[t.subject] = (subjectStats[t.subject] || 0) + t.hours;
  });

  let subjects = Object.keys(subjectStats);

  if(subjects.length > 0){
    let weak = subjects.reduce((a,b)=> subjectStats[a] < subjectStats[b] ? a : b);
    let strong = subjects.reduce((a,b)=> subjectStats[a] > subjectStats[b] ? a : b);

    msg += `📉 Weak subject: <b>${weak}</b> (needs more focus)<br>`;
    msg += `📈 Strong subject: <b>${strong}</b><br><br>`;
  }

  // ⏳ Study hours insight
  let totalHours = tasks.reduce((a,b)=>a+(b.hours||0),0);

  if(totalHours < 2){
    msg += "⏳ Study time is low today. Try to increase focus.<br><br>";
  } 
  else if(totalHours > 6){
    msg += "🔥 You studied a lot! Take a break to avoid burnout.<br><br>";
  }

  // 🎯 Smart suggestion
  if(pending.length > 0){
    msg += `🎯 Start with: <b>${pending[0].subject}</b><br>`;
  }

  box.innerHTML = msg || "💪 You're doing great! Stay consistent.";
}
