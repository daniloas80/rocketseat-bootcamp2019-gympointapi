/* eslint-disable prettier/prettier */
/* eslint-disable no-dupe-keys */
import * as Yup from 'yup';
import { Op } from 'sequelize';
import Students from '../models/Students';
import HelpOrders from '../models/HelpOrders';
import OrdersHelpMail from '../jobs/OrdersHelpMail';
import Queue from '../../lib/Queue';

class HelpOrdersController {
  async index(req, res) {

    // const params = new URL(document.location).searchParams;
   // const studentId = params.get('id') ? params.get('id') : '';

    const {student_id, id } = req.params;

    // caso o usuário tenha passado um id, ele está querendo ver todas as
    // perguntas daquele usuário, caso venha sem id, o sistema irá listar
    // todas as perguntas que ainda não foram respondidas
    // Verifica se o id do aluno passado exite na base de dados
    if (student_id > 0) {
      // const student = await Students.findByPk(student_id);
      const studentHelpOrders = await HelpOrders.findOne({
        include: [
          {
            model: Students,
            as: 'students',
            attributes: ['id', 'name']
          }
        ],
        where: {
          id
          // student_id: {
          //   [Op.not]: null
          // },
          // answer: {
          //   [Op.is]: null
          // },
          // student_id
        }
      });
      if (Object.keys(studentHelpOrders).length >= 1) {
        return res.json(studentHelpOrders);
      }
    }

    // const student = await Students.findByPk(student_id);
    // if (!student) {
    //   return res.status(400).json({ error: 'Student not found' });
    // }

    const helporders = await HelpOrders.findAll({
      include: [
        {
          model: Students,
          as: 'students',
          attributes: ['id', 'name']
        }
      ],
      where: {
        student_id: {
          [Op.not]: null
        },
        answer: {
          [Op.is]: null
        }
      }
    });

    return res.status(200).json(helporders);
  }

  async store(req, res) {
    // código para validação das informações que são passada pelo usuário
    const schema = Yup.object().shape({
      question: Yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { question } = req.body;
    const student_id = req.params.id;

    // Verifica se o id do aluno passado exite na base de dados
    const student = await Students.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    // gravo no banco de dados as informações da matrícula
    await HelpOrders.create({
      student_id,
      question
    });

    return res.status(200).json({
      message: `Olá ${student.name}, Sua pergunta foi enviada com sucesso!`
    });
  }

  async update(req, res) {
    // código para validação das informações que são passada pelo usuário
    const schema = Yup.object().shape({
      answer: Yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const reply = req.body;
    const help_orders_id = req.params.id;

    // Verifica se o id do aluno passado exite na base de dados
    const student = await Students.findByPk(reply.student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    // Verifica se o id da ajuda passado exite na base de dados
    const helpOrders = await HelpOrders.findOne({
      where: {
        id: help_orders_id,
        student_id: reply.student_id
      }
    });

    if (!helpOrders) {
      return res
        .status(400)
        .json({ error: 'Question not found for this record' });
    }

    await helpOrders.update({
      answer: reply.answer,
      answer_at: new Date()
    });

    // processo de envio de emails por filas usando o redis
    await Queue.add(OrdersHelpMail.key, {
      student,
      question: helpOrders.question,
      answer: reply.answer
    });

    // informações filtradas passada para o frontend
    return res.json({ helpOrders });
  }
}

export default new HelpOrdersController();
