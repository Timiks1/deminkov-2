const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 3000;

const studentDatabase = new sqlite3.Database("students.db");

studentDatabase.run(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    groupNumber INTEGER NOT NULL,
    rate REAL NOT NULL
  )
`);

app.use(bodyParser.json());

app.get("/allStudentsData", (req, res) => {
  studentDatabase.all("SELECT * FROM students", (err, students) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.json(students);
  });
});

app.post("/addNewStudent", (req, res) => {
  const newStudentInfo = req.body;
  if (!newStudentInfo.firstName || !newStudentInfo.lastName) {
    return res
      .status(400)
      .json({ error: "firstName and lastName are required fields" });
  }

  studentDatabase.run(
    "INSERT INTO students (firstName, lastName, groupNumber, rate) VALUES (?, ?, ?, ?)",
    [
      newStudentInfo.firstName,
      newStudentInfo.lastName,
      newStudentInfo.groupNumber,
      newStudentInfo.rate,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      res.json({
        id: this.lastID,
        ...newStudentInfo,
      });
    }
  );
});

app.get("/studentDetails/:id", (req, res) => {
  const studentId = req.params.id;
  studentDatabase.get(
    "SELECT * FROM students WHERE id = ?",
    [studentId],
    (err, student) => {
      if (err) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json(student);
    }
  );
});

app.put("/updateStudentInfo/:id", (req, res) => {
  const studentId = req.params.id;
  const updatedStudentData = req.body;

  if (!updatedStudentData.firstName || !updatedStudentData.lastName) {
    return res
      .status(400)
      .json({ error: "firstName and lastName are required fields" });
  }

  studentDatabase.run(
    "UPDATE students SET firstName = ?, lastName = ?, groupNumber = ?, rate = ? WHERE id = ?",
    [
      updatedStudentData.firstName,
      updatedStudentData.lastName,
      updatedStudentData.groupNumber,
      updatedStudentData.rate,
      studentId,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json({ id: studentId, ...updatedStudentData });
    }
  );
});

app.delete("/removeStudentData/:id", (req, res) => {
  const studentId = req.params.id;

  studentDatabase.run(
    "DELETE FROM students WHERE id = ?",
    [studentId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json({ id: studentId, message: "Student removed successfully" });
    }
  );
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
