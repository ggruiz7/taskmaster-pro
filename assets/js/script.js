var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);
  // perform audit(s) before adding item to page

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

const auditTask = function(taskLi) {
  // get due date from task element
  const date = $(taskLi)
    .find('span')
    .text()
    .trim();

  // convert to moment object at 5:00pm
  const time = moment(date, 'L').set('hour', 17);

  // remove any old classes from element
  $(taskLi).removeClass('list-group-item-warning list-group-item-dander');

  // apply new class if task is near/overdue
  if (moment().isAfter(time)) {
    $(taskLi).addClass('list-group-item-dander');
  }
  else if (Math.abs(moment().diff(time, 'days')) <= 2) {
    $(taskLi).addClass('list-group-item-warning');
  }
}

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("")
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription")
    .val()
    .trim();

  var taskDate = $("#modalDueDate")
    .val()
    .trim();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// task text was clicked
$(".list-group").on("click", "p", function() {
  // get current text of p element
  var text = $(this)
    .text()
    .trim();

  // replace p element with a new textarea
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  $(this).replaceWith(textInput);

  // auto focus new element
  textInput.trigger("focus");
});

// editable field was un-focused
$(".list-group").on("blur", "textarea", function() {
  var text = $(this)
    .val()
    .trim();

  // get status type and position in the list
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localstorage
  tasks[status][index].text = text;
  saveTasks();

  // recreate p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);
  // replace textarea with new content
  $(this).replaceWith(taskP);
});

// due date was clicked
$(".list-group").on("click", "span", function() {
  var date = $(this)
    .text()
    .trim();

  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);
  $(this).replaceWith(dateInput);

  // enable jQuery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      // when calander is closed, force a 'change' event on the 'dateInput'
      $(this).trigger('change');
    }
  })

  // automatically bring up calendar
  dateInput.trigger("focus");
});

// value of due date was changed
$(".list-group").on("change", "input[type='text']", function() {
  var date = $(this)
    .val()
    .trim();
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  var index = $(this)
    .closest(".list-group-item")
    .index();

  tasks[status][index].date = date;
  saveTasks();

  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);
  $(this).replaceWith(taskSpan);

  // pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest('.list-group-item'));
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// make list item cards sortable
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: event => console.log("activate", this),
  deactivate: event => console.log("deactivate", this),
  over: event => console.log("over", event.target),
  out: event => console.log("out", event.target),
  update: function(event) {
    // array to store task data in
    const tempArr = [];

    // loop over current set of children in sortable list
    $(this).children().each(function() {
      var text = $(this)
        .find("p")
        .text()
        .trim();
      var date = $(this)
        .find("span")
        .text()
        .trim();

      // add task data to new array as an object
      tempArr.push({
        text: text,
        date: date
      })

      console.log(tempArr);
    });

    // trim down list's id to  match object property
    const arrName =$(this)
      .attr('id')
      .replace('list-', "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  } 
});

// create droppable area
$('#trash').droppable({
  accept: ".card .list-group-item",
  tolerance: 'touch',
  drop: function (event, ui) {
    console.log('drop');
    ui.draggable.remove();
  },
  over: function (event, ui) {
    console.log('over')
  },
  out: function (event, ui) {
    console.log('out')
  }
});

// add datepicker calander from (jQuery ui?)
$('#modalDueDate').datepicker({
  // minDate: 1,
  onClose: function() {
    // when calendar is closed, force a "change" event on the `dateInput`
    $(this).trigger("change");
  }
});

// load tasks for the first time
loadTasks();






















// $(".card .list-group").sortable({
//   connectWith: $(".card .list-group"),
//   scroll: false,
//   tolerance: "pointer",
//   helper: "clone",
//   activate: function(event) {
//     console.log("activate", this);
//   },
//   deactivate: function(event) {
//     console.log("deactivate", this);
//   },
//   over: function(event) {
//     console.log("over", event.target);
//   },
//   out: function(event) {
//     console.log("out", event.target);
//   },
//   update: function(event) {
//     console.log("update", this);
//   }
// });
