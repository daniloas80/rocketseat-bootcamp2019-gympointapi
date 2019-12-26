import * as Yup from 'yup';
import Students from '../models/Students';
import HelpOrders from '../models/HelpOrders';
import OrdersHelpMail from '../jobs/OrdersHelpMail';
import Queue from '../../lib/Queue';

class HelpOrdersController {
  async index(req, res) {
    const student_id = req.params.id;

    // Verifica se o id do aluno passado exite na base de dados
    const student = await Students.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    const helpOrders = await HelpOrders.findAll({
      include: [
        {
          model: Students,
          as: 'students',
          attributes: ['id', 'name']
        }
      ],
      where: {
        student_id
      }
    });

    return res.status(200).json({ helpOrders });
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
