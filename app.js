const express = require("express");
const { open } = require("sqlite");

const path = require("path");
const sqlite3 = require("sqlite3");

var format = require("date-fns/format");
var isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Error Message : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const validateTodo = async (req, res, next) => {
  const { status, priority, search_q, category, date } = req.query;

  if (status !== undefined) {
    if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
      res.status(400);
      res.send("Invalid Todo Status");
      return;
    }
  }
  if (priority !== undefined) {
    if (priority !== "HIGH" && priority !== "LOW" && priority !== "MEDIUM") {
      res.status(400);
      res.send("Invalid Todo Priority");
      return;
    }
  }
  if (category !== undefined) {
    if (category !== "WORK" && category !== "HOME" && category !== "LEARNING") {
      res.status(400);
      res.send("Invalid Todo Category");
      return;
    }
  }
  if (date !== undefined) {
    if (!isValid(new Date(date))) {
      res.status(400);
      res.send("Invalid Due Date");
      return;
    } else {
      next();
    }
  } else {
    next();
  }
};

app.get("/todos/", validateTodo, async (req, res) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = req.query;

  const getTodosQuery = `
    SELECT 
    id, todo, priority, status, category, due_date AS dueDate
    FROM todo
    WHERE
        status LIKE '%${status}%'
        AND priority LIKE '%${priority}%'
        AND category LIKE '%${category}%'
        AND todo LIKE '%${search_q}%';
  `;

  const todosArray = await db.all(getTodosQuery);
  res.send(todosArray);
});

app.get("/todos/:todoId", validateTodo, async (req, res) => {
  const { todoId } = req.params;

  const getTodoQuery = `
    SELECT 
    id, todo, priority, status, category, due_date AS dueDate
    FROM todo
    WHERE
        id = ${todoId};
  `;

  const todosArray = await db.get(getTodoQuery);
  res.send(todosArray);
});

app.get("/agenda/", validateTodo, async (req, res) => {
  let { date } = req.query;
  date = format(new Date(date), "yyyy-MM-dd");

  const getTodoQuery = `
    SELECT 
    id, todo, priority, status, category, due_date AS dueDate
    FROM todo
    WHERE
        due_date = '${date}';
  `;

  const todosArray = await db.all(getTodoQuery);
  res.send(todosArray);
});

app.post("/todos/", async (req, res) => {
  let { id, todo, priority, status, category, dueDate } = req.body;
  if (status !== undefined) {
    if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
      res.status(400);
      res.send("Invalid Todo Status");
      return;
    }
  }
  if (priority !== undefined) {
    if (priority !== "HIGH" && priority !== "LOW" && priority !== "MEDIUM") {
      res.status(400);
      res.send("Invalid Todo Priority");
      return;
    }
  }
  if (category !== undefined) {
    if (category !== "WORK" && category !== "HOME" && category !== "LEARNING") {
      res.status(400);
      res.send("Invalid Todo Category");
      return;
    }
  }
  if (dueDate !== undefined) {
    if (!isValid(new Date(dueDate))) {
      res.status(400);
      res.send("Invalid Due Date");
      return;
    } else {
      dueDate = format(new Date(dueDate), "yyyy-MM-dd");
    }
  }

  const getTodoQuery = `
  SELECT * FROM todo WHERE id = ${id};
  `;

  let existingTodo = undefined;
  existingTodo = await db.all(getTodoQuery);

  if (existingTodo.length !== 0) {
    const updateExistingTodo = `
      UPDATE todo
      SET 
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${dueDate}'
    WHERE id = ${id};
      `;

    await db.run(updateExistingTodo);
    res.send("Todo Successfully Added");
  } else {
    const addTodoQuery = `
    INSERT INTO todo (id, todo, category, priority, status, due_date) 
    VALUES (
        ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
    );
  `;

    await db.run(addTodoQuery);
    res.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  let { priority, todo, status, category, dueDate } = req.body;

  if (status !== undefined) {
    if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
      res.status(400);
      res.send("Invalid Todo Status");
      return;
    }
  }
  if (priority !== undefined) {
    if (priority !== "HIGH" && priority !== "LOW" && priority !== "MEDIUM") {
      res.status(400);
      res.send("Invalid Todo Priority");
      return;
    }
  }
  if (category !== undefined) {
    if (category !== "WORK" && category !== "HOME" && category !== "LEARNING") {
      res.status(400);
      res.send("Invalid Todo Category");
      return;
    }
  }
  if (dueDate !== undefined) {
    if (!isValid(new Date(dueDate))) {
      res.status(400);
      res.send("Invalid Due Date");
      return;
    } else {
      dueDate = format(new Date(dueDate), "yyyy-MM-dd");
    }
  }

  let updateTodoQuery = null;

  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                status = '${status}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      res.send("Status Updated");
      break;
    case priority !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                priority = '${priority}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      res.send("Priority Updated");
      break;
    case todo !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                todo = '${todo}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      res.send("Todo Updated");
      break;
    case category !== undefined:
      const updateCategoryQuery = `
            UPDATE
                todo
            SET 
                category = '${category}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateCategoryQuery);
      res.send("Category Updated");
      break;
    case dueDate !== undefined:
      const updateDateQuery = `
            UPDATE
                todo
            SET 
                due_date = '${dueDate}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateDateQuery);
      res.send("Due Date Updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const deleteTodoQuery = `
            DELETE FROM 
                todo
            WHERE 
               id=${todoId}
     ;`;

  await db.run(deleteTodoQuery);
  res.send("Todo Deleted");
});

module.exports = app;
