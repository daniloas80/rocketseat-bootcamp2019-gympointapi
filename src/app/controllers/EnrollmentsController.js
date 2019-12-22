import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, addMonths, format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Students from '../models/Students';
import Plans from '../models/Plans';
import Enrollments from '../models/Enrollments';
import Notification from '../schemas/Notification';
import EnrollmentMail from '../jobs/EnrollmentMail';
import Queue from '../../lib/Queue';

class EnrollmentsController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const enrollments = await Enrollments.findAll({
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Students,
          as: 'students',
          attributes: ['id', 'name']
        },
        {
          model: Plans,
          as: 'plans',
          attributes: ['id', 'title']
        }
      ]
    });

    if (enrollments.length >= 1) {
      return res.json(enrollments);
    }
    return res.json({ message: 'There is no Enrollments to list' });
  }

  async store(req, res) {
    // código para validação das informações que são passada pelo usuário
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;
    /**
     * Check for past dates
     */
    const start_tdate = parseISO(start_date);
    const hourStart = startOfHour(parseISO(start_date));
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    // Verifica se o id do estudante passado exite na base de dados
    const student = await Students.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    // Verifica se o id do plano passado exite na base de dados
    const plan = await Plans.findByPk(plan_id);
    if (!plan) {
      return res.status(400).json({ error: 'Plan not found' });
    }

    // preço a pagar conforme a duração do plano
    const payPrice = plan.price * plan.duration;
    const end_date = addMonths(parseISO(start_date), plan.duration);

    // o aluno pode ter várias matrículas, porém não poderá ter duas matrículas antes do término da matrícula corrente
    const enrollCheck = await Enrollments.findAll({
      where: {
        student_id: req.body.student_id
      },
      order: [['end_date', 'DESC']]
    });

    // Verifica se o id do estudante já está matriculado
    if (enrollCheck) {
      // Verifico qual o último dia da matrícula do aluno
      const lastDay = enrollCheck[0].end_date;
      const formattedDate = format(lastDay, 'dd/MM/yyyy', {
        locale: pt
      });

      if (start_tdate <= lastDay) {
        return res.status(400).json({
          error: `Student already enrolling. He can not start before ${formattedDate}`
        });
      }
    }

    // gravo no banco de dados as informações da matrícula
    await Enrollments.create({
      student_id,
      plan_id,
      start_date: parseISO(start_date),
      end_date,
      price: payPrice
    });

    // guardo a informação que será passado por email para o aluno
    const formattedStartDay = format(start_tdate, 'dd/MM/yyyy', {
      locale: pt
    });
    const formattedFinalDay = format(end_date, 'dd/MM/yyyy', {
      locale: pt
    });
    // O alemão usa vírgula como separador de decimal e ponto para milhares por isso o uso do 'de-DE' (não funcionou ainda deixou o . como separador decimal. Assim como também não funcionou 'sgn-BR')
    const formattedPayPrice = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(payPrice);

    const formattedPlanPrice = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(plan.price);

    // Para o envio do e-mail a função abaixo não era necessário, poderei incrementar isso na versão web ou mobile
    await Notification.create({
      content: `Olá ${student.name} sua matrícula foi realizada com sucesso. O plano escolhido foi  ${plan.title} que se inicia em ${formattedStartDay} com o término em ${formattedFinalDay}. O valor de sua mensalidade é de R$ ${formattedPayPrice}`,
      student: student_id
    });

    // processo de envio de emails por filas usando o redis
    await Queue.add(EnrollmentMail.key, {
      student,
      plan,
      formattedStartDay,
      formattedFinalDay,
      formattedPlanPrice,
      formattedPayPrice
    });

    // informações filtradas passada para o frontend
    return res.json({
      student_id,
      name: student.name,
      plan_id,
      title: plan.title,
      start_date,
      end_date,
      payPrice
    });
  }

  async update(req, res) {
    // Verifica se o id do plano passado exite na base de dados
    const enrollments = await Enrollments.findByPk(req.params.id);
    if (!enrollments) {
      return res.status(400).json({ error: 'Enrollment not found' });
    }

    // código para validação das informações que são passada pelo usuário
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;
    // // console.log(Students);

    // const enroll = await Enrollments.findByPk(req.params.id);

    // Verifica se o id do estudante passado exite na base de dados
    const student = await Students.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    // Verifica se já existe um estudante matriculado caso o usuário tenta passar um estudante diferente
    if (student_id !== enrollments.student_id) {
      return res.status(400).json({ error: 'Student already enrolling' });
    }

    // Verifica se o id do plano passado exite na base de dados
    const plan = await Plans.findByPk(plan_id);
    if (!plan) {
      return res.status(400).json({ error: 'Plan not found' });
    }

    // preço a pagar conforme a duração do plano
    const payPrice = plan.price * plan.duration;
    const end_date = addMonths(parseISO(start_date), plan.duration);

    await enrollments.update({
      plan_id,
      start_date: parseISO(start_date),
      end_date,
      price: payPrice
    });
    // informações filtradas passada para o frontend
    return res.json({
      student_id,
      name: student.name,
      plan_id,
      title: plan.title,
      start_date,
      end_date,
      payPrice
    });
  }

  async delete(req, res) {
    Enrollments.destroy({
      where: {
        id: req.params.id
      }
    })
      .then(function checkDeleted(deletedRecord) {
        if (deletedRecord === 1) {
          res.status(200).json({ message: 'Deleted successfully' });
        }
        res.status(404).json({ message: 'Record not found' });
      })
      .catch(function checkError(error) {
        res.status(500).json(error);
      });
  }
}
export default new EnrollmentsController();
