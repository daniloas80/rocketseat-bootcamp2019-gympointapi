import * as Yup from 'yup';
import Plans from '../models/Plans';

class PlansController {
  async index(req, res) {
    // Se o usuário estiver tentando fazer uma edição, a rota virá com o parâmentro
    // id preenchido, caso contrário, o usuário estará na página principal listando todos.
    const plan_id = req.params.id;

    if (plan_id > 0) {
      const plans = await Plans.findByPk(plan_id);
      if (Object.keys(plans).length >= 1) {
        return res.json(plans);
      }
    }

    const plans = await Plans.findAll();

    if (Object.keys(plans).length >= 1) {
      return res.json(plans);
    }
    return res.json({ message: 'There is no Plan to list' });
  }

  async store(req, res) {
    // código para validação das informações que são passada pelo usuário
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required(),
      price: Yup.number().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const plansExists = await Plans.findOne({
      where: { title: req.body.title }
    });

    if (plansExists) {
      return res.status(400).json({ error: 'Plan already exists' });
    }

    // desta forma retornamos somente as informações que precisamos para o frontend
    const { id, title, duration, price } = await Plans.create(req.body);
    return res.json({
      id,
      title,
      duration,
      price
    });
  }

  async update(req, res) {
    // código para validação das informações que são passada pelo usuário
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number()
        .min(1)
        .positive()
        .required(),
      price: Yup.number()
        .min(0)
        .positive()
        .required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { title } = req.body;
    // // console.log(Students);

    const plan = await Plans.findByPk(req.params.id);

    if (title !== plan.title) {
      const planExists = await Plans.findOne({ where: { title } });

      if (planExists) {
        return res.status(400).json({ error: 'Plan already exists' });
      }
    }

    const { id, duration, price } = await plan.update(req.body);
    return res.json({
      id,
      title,
      duration,
      price
    });
  }

  async delete(req, res) {
    Plans.destroy({
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
export default new PlansController();
