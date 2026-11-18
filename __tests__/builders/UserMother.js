import { User } from '../../src/domain/User.js';

/**
 * Object Mother: fornece instâncias prontas e fixas de User.
 *
 * Usuários são entidades simples, com poucos "tipos" que se repetem
 * em quase todos os testes (PADRAO e PREMIUM). Por isso, alguns métodos
 * estáticos com nomes descritivos bastam — não há explosão de combinações.
 */
export class UserMother {
    static umUsuarioPadrao() {
        return new User(1, 'Usuário Padrão', 'padrao@email.com', 'PADRAO');
    }

    static umUsuarioPremium() {
        return new User(2, 'Usuário Premium', 'premium@email.com', 'PREMIUM');
    }
}
