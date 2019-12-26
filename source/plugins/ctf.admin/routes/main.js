import express from 'express';

import db from '../functions/database';

const router = express.Router();

router.get('/', (req, res) => {
	res.send('Testare ruta').sendStatus(200);
});

router.get('/questions', async (req, res) => {
	try {
		let questions = [];
		
		(await db.getAll('Questions')).map(({ID, LockedBy, Question}) => {
			console.log(ID, LockedBy, Question);
			questions.push({
				id: ID,
				lockedBy: LockedBy,
				question: Question
			});
		})

		res.send(questions);
	} catch (err) {
		console.error(err);
		res.send({
			err: "There was a problem fetching the questions from database"
		})
	} 
});

router.post('/team/add', async (req, res) => {
	let {teamName} = req.body;
	
	let team = await db.getFirstRow('Teams', [
		{
			column: 'Name',
			value: teamName
		}
	])

	if (!team) {
		await db.runSQLCMD("INSERT INTO `Teams`(`Name`) VALUES ('" + teamName + "');")
		res.sendStatus(200);
	} else {
		res.send({
			err: 'Team name is already in use'
		})
	}
});

router.post('/answer/start', async (req, res) => {
	let {teamName, questionText} = req.body;

	let team = await db.getFirstRow('Teams', [
		{
			column: 'Name',
			value: teamName
		}
	])
	let question = await db.getFirstRow('Questions', [
		{
			column: 'Question',
			value: questionText
		}
	])
	let answer = await db.getFirstRow('Answers', [
		{
			column: 'TeamID',
			value: team.ID
		},
		{
			column: 'QuestionID',
			value: question.ID
		}
	])

	
	if (!answer) {
		if (team) {
			if (question) {
				await db.runSQLCMD("INSERT INTO `Answers`(`QuestionID`, `TeamID`, `Started`) VALUES (" + question.ID 
										+ "," + team.ID + "," + Date.now().toString() + ");")
				
				res.sendStatus(200);
			} else {
				res.send({
					err: 'Missing question'
				})
			}
		} else {
			res.send({
				err: 'Missing team'
			})
		}
	} else {
		res.send({
			err: 'Question already started'
		})
	}
});

router.post('/answer/finish', async (req, res) => {
	let { teamName, questionText, teamAnswer } = req.body;

	let team = await db.getFirstRow('Teams', [
		{
			column: 'Name',
			value: teamName
		}
	])
	let question = await db.getFirstRow('Questions', [
		{
			column: 'Question',
			value: questionText
		}
	])
	let answer = await db.getFirstRow('Answers', [
		{
			column: 'TeamID',
			value: team.ID
		},
		{
			column: 'QuestionID',
			value: question.ID
		}
	])

	
	if (team) {
		if (question) {
			if (answer) {
				let sqlCMD = "UPDATE `Answers` SET `Finished`='" + Date.now().toString() + "', `Score`='" + question.Score
								+ "' WHERE ID='" + answer.ID + "';";
				

				console.log(sqlCMD);
				await db.runSQLCMD(sqlCMD);

				res.sendStatus(200);
			} else {
				res.send({
					err: 'Question didn\'t started yet'
				})
			}
		} else {
			res.send({
				err: 'Missing question'
			})
		}
	} else {
		res.send({
			err: 'Missing team'
		})
	}
});


export default router;