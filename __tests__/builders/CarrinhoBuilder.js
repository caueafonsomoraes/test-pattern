import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { UserMother } from './UserMother.js';

/**
 * Data Builder: constrói instâncias de Carrinho de forma fluente.
 *
 * O carrinho é um objeto com muitas variações (usuário, quantidade e valor
 * dos itens, vazio...). Em vez de um método de fábrica para cada combinação,
 * o builder parte de valores padrão válidos e o teste sobrescreve apenas
 * o que for relevante para o cenário.
 */
export class CarrinhoBuilder {
    constructor() {
        // Valores padrão: usuário comum com 1 item de R$ 100,00
        this.user = UserMother.umUsuarioPadrao();
        this.itens = [new Item('Item Padrão', 100)];
    }

    comUser(user) {
        this.user = user;
        return this;
    }

    comItens(itens) {
        this.itens = itens;
        return this;
    }

    vazio() {
        this.itens = [];
        return this;
    }

    build() {
        // Cópia do array para que testes não compartilhem a mesma referência
        return new Carrinho(this.user, [...this.itens]);
    }
}

/** Atalho para deixar os testes mais legíveis: umCarrinho().comUser(...).build() */
export const umCarrinho = () => new CarrinhoBuilder();
