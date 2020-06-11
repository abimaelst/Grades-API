import express from "express";
import { promises as fs } from "fs";
import logger from '../index.js'

const router = express.Router();

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

router.post("/", async (req, res) => {
  let newGrande = req.body;

  try {
    const data = await fs.readFile("grades.json", "utf8");
    let json = JSON.parse(data);
    let date = new Date()
    
    
    newGrande = { id: json.nextId++, ...newGrande, timestamp: date.toISOString()};
    json.grades.push(newGrande);

    await fs.writeFile("grades.json", JSON.stringify(json));
    res.status(201).send(newGrande);
    logger.info(`POST /grades - ${JSON.stringify(newGrande)} `)

  } catch (err) {
    res.status(400).send({ erro: err.message });
    logger.error(`POST /grades - ${err.message} `)
  }
});

router.get("/", async (_, res) => {
  try {
    const data = await fs.readFile("grades.json");
    const json = JSON.parse(data);
    const total = (json.grades).length

    delete json.nextId;
    res.status(200).send(json);
    logger.info(`GET /grades - registration total: ${total} `)
  } catch (err) {
    res.status(400).send({ Error: err.message });
    logger.error(`GET /grades - ${err.message} `)
  }
});

router.delete("/user/:id", async (req, res) => {
  try {
    const data = await fs.readFile("grades.json");
    const json = JSON.parse(data);

    const validate = json.grades.find((grade) => grade.id === parseInt(req.params.id, 10))
   
    if(validate === undefined) {
      res.status(204).send('User not found')
      logger.info(`DELETE /user -  ${parseInt(req.params.id, 10)} user not found`)
      res.end()
    } else {
      const userDeleted = await json.grades.filter((grade) => grade.id === parseInt(req.params.id, 10))
      const newGrades = json.grades.filter((grade) => grade.id !== parseInt(req.params.id, 10))

      json.grades = newGrades

      await fs.writeFile('grades.json', JSON.stringify(json));

      res.status(200).send(userDeleted);
      logger.info(`DELETE /user - ${JSON.stringify(userDeleted)} `)
    }
  }catch (err) {
    res.status(400).send({ erro: err.message });
    logger.error(`DELETE /user - ${err.message} `)
  }
})

router.get("/user/:id", async (req, res) => {
  try {
    const data = await fs.readFile("grades.json");
    const json = JSON.parse(data);

    const findGradeId = json.grades.find((grade) => grade.id === parseInt(req.params.id, 10))

    if ( findGradeId === undefined) {
      res.status(204).send('User not found')
      logger.info(`GET /user -  ${parseInt(req.params.id, 10)} user not found`)
      res.end()
    } else {
    res.status(200).send(findGradeId);
    logger.info(`GET /user - ${JSON.stringify(findGradeId)}`)

    }
  }catch (err) {
    res.status(400).send({ erro: err.message });
    logger.error(`GET /user - ${err.message} `)
  }
})

router.put("/user/:id", async (req, res) => {
  const newData = req.body
  try {
    const data = await fs.readFile("grades.json");
    const json = JSON.parse(data);

    const validate = json.grades.find((grade) => grade.id === parseInt(req.params.id, 10))

    if (validate === undefined) {
      res.status(204).send('User not found')
      logger.info(`PUT /user -  ${parseInt(req.params.id, 10)} user not found`)
      res.end()
    } else {
      const index = json.grades.findIndex((grade) => grade.id === parseInt(req.params.id, 10))
      const changeStudent = json.grades[index]
      json.grades[index].student = newData.student
      json.grades[index].subject = newData.subject
      json.grades[index].type = newData.type
      json.grades[index].value = newData.value
      
      res.status(200).send(changeStudent)
      logger.info(`PUT /user - ${JSON.stringify(changeStudent)}`)
    }

    await fs.writeFile('grades.json', JSON.stringify(json));
    res.end();
    
  }catch (err) {
    res.status(400).send({ error: err.message });
    logger.error(`PUT /user - ${err.message} `)
  }
})

router.get('/score', async (req, res) => {
  let info = req.body;
  
  try {
    const data = await fs.readFile("grades.json", "utf8");
    let json = JSON.parse(data);
    
    const filterSubject = json.grades.filter((grade) => info.student === grade.student).filter((grade) => info.subject === grade.subject)
    const totalScore = filterSubject.reduce((acc, cur) => acc + cur.value, 0)

    res.status(200).send(`Your score is ${totalScore}`)
    logger.info(`GET /score - ${JSON.stringify(filterSubject)}: score ${JSON.stringify(totalScore)}`)

  
  } catch (err) {
    res.status(400).send({ erro: err.message });
    logger.error(`GET /score - ${err.message} `)
  }
});

router.get('/average', async (req, res) => {
  let averageReq = req.body;
  
  try {
    const data = await fs.readFile("grades.json", "utf8");
    let json = JSON.parse(data);
    
    const subjects = json.grades.filter((grade) => averageReq.subject === grade.subject).filter((grade) => averageReq.type === grade.type)
    const totalScore = subjects.reduce((acc, cur) => acc + cur.value, 0)
    const average = subjects.length === 0 ? 'No results' : ( totalScore / subjects.length )

    res.status(200).send(`Avarege for subject: ${averageReq.subject} and type: ${averageReq.type}  is ${average}`) 
    logger.info(`GET /average - Avarege for subject: ${averageReq.subject} and type: ${averageReq.type}  is ${average}`)
    
  } catch (err) {
    res.status(400).send({ erro: err.message });
    logger.error(`GET /average - ${err.message} `)
  }
});

router.get('/top', async (req, res) => {
  let topReq = req.body;
  
  try {
    const data = await fs.readFile("grades.json", "utf8");
    let json = JSON.parse(data);
    
    const subjects = await json.grades.filter((grade) => topReq.subject === grade.subject).filter((grade) => topReq.type === grade.type)
    const top3 = subjects.sort((a, b) => b.value - a.value ).slice(0, 3)
    const listTop3 = []
    
    for (let top of top3) {
      let { id, student, subject, type, value } = top

      listTop3.push({ id, student, subject, type, value })
    }

    res.send(listTop3) 
    logger.info(`GET /top - List top 3 ${listTop3}`)
    
  } catch (err) {
    res.status(400).send({ erro: err.message });
    logger.error(`GET /top - ${err.message} `)
  }
});

export default router;
