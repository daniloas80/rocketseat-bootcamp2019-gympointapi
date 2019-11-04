import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        // A propriedade VIRTUAL é usada temporariamente e sua informação não é lançada no db
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING
      },
      { sequelize }
    );

    // Esta função addHook é usada para executar um código em determinado momento.
    // Neste caso, "antes de salvar" as informações no banco de dados criptogtafamos a senha.
    this.addHook('beforeSave', async user => {
      if (user.password) {
        // Na função hash do bycript, o primeiro segundo argumento indica a força da criptografia.
        // O número 8 é razoável, números maiores deixariam a aplicação lenta.
        user.password_hash = await bcrypt.hash(user.password, 8);
      }
    });

    return this;
  }

  checarSenha(password) {
    // A função "compare" retorna true se a senha informada corresponde à senha criptografada no db
    return bcrypt.compare(password, this.password_hash);
  }
}

export default User;
