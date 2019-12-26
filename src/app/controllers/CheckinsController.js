import { startOfWeek, lastDayOfWeek } from 'date-fns';
import { Op } from 'sequelize';
import Chekins from '../models/Checkins';
import Students from '../models/Students';

class CheckinsController {
  async index(req, res) {
    const student_id = req.params.id;

    // Verifica se o id do aluno passado exite na base de dados
    const student = await Students.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    const checkins = await Chekins.findAndCountAll({
      where: {
        student_id
      }
    });

    return res.status(200).json({
      message: `Olá ${student.name}, você já fez ${checkins.count} checkins esta semana!`
    });
  }

  async store(req, res) {
    // código para validação das informações que são passada pelo usuário
    // const schema = Yup.object().shape({
    //   student_id: Yup.number().required()
    // });

    // if (!(await schema.isValid(req.body))) {
    //   return res.status(400).json({ error: 'Validation fails' });
    // }

    const student_id = req.params.id;

    // Verifica se o id do aluno passado exite na base de dados
    const student = await Students.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    const resStartOfWeek = startOfWeek(new Date(), {
      weekStartsOn: 1
    });

    const resLastDayOfWeek = lastDayOfWeek(new Date(), {
      weekStartsOn: 1
    });

    // console.log(resStartOfWeek);
    // console.log(resLastDayOfWeek);

    // return resLastDayOfWeek;

    // É necessário verificar se o aluno fez 5 checkins no período de 7 dias
    const checkins = await Chekins.findAndCountAll({
      where: {
        student_id,
        created_at: {
          [Op.between]: [resStartOfWeek, resLastDayOfWeek]
        }
      }
    });
    const { count } = checkins;

    if (count >= 5) {
      return res.status(400).json({
        error: 'Acesso bloqueado! Você já fez 5 checkins esta semana'
      });
    }

    // gravo no banco de dados as informações da matrícula
    await Chekins.create({
      student_id
    });

    return res
      .status(200)
      .json({ message: `Olá ${student.name}, acesso liberado!` });
  }
}

export default new CheckinsController();
