import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { Pedido } from '../src/domain/Pedido.js';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';

describe('CheckoutService', () => {
    const cartao = { numero: '4111111111111111', validade: '12/30', cvv: '123' };

    describe('quando o pagamento falha', () => {
        let gatewayStub;
        let repositoryDummy;
        let emailDummy;
        let checkoutService;
        let carrinho;

        beforeEach(() => {
            // Arrange
            carrinho = new CarrinhoBuilder().build();

            // Stub: só existe para devolver uma resposta pré-definida (pagamento recusado)
            gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: false }) };

            // Dummies: precisam existir para montar o SUT, mas não devem ser usados
            repositoryDummy = { salvar: jest.fn() };
            emailDummy = { enviarEmail: jest.fn() };

            checkoutService = new CheckoutService(gatewayStub, repositoryDummy, emailDummy);
        });

        it('deve retornar null (verificação de estado)', async () => {
            // Act
            const pedido = await checkoutService.processarPedido(carrinho, cartao);

            // Assert
            expect(pedido).toBeNull();
        });

        it('não deve salvar o pedido nem enviar e-mail', async () => {
            // Act
            await checkoutService.processarPedido(carrinho, cartao);

            // Assert
            expect(repositoryDummy.salvar).not.toHaveBeenCalled();
            expect(emailDummy.enviarEmail).not.toHaveBeenCalled();
        });
    });

    describe('quando um cliente Padrão finaliza a compra', () => {
        it('deve retornar o pedido salvo com o totalFinal sem desconto (verificação de estado)', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder()
                .comUser(UserMother.umUsuarioPadrao())
                .comItens([new Item('Livro', 50), new Item('Caneca', 30)])
                .build();

            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const repositoryStub = {
                salvar: jest.fn().mockImplementation(async (pedido) =>
                    new Pedido(42, pedido.carrinho, pedido.totalFinal, pedido.status)),
            };
            const emailStub = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailStub);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, cartao);

            // Assert
            expect(pedido).toBeInstanceOf(Pedido);
            expect(pedido.id).toBe(42);
            expect(pedido.totalFinal).toBe(80);
            expect(pedido.status).toBe('PROCESSADO');
        });
    });

    describe('quando um cliente Premium finaliza a compra', () => {
        let gatewayStub;
        let repositoryStub;
        let emailMock;
        let carrinho;
        let pedido;

        beforeEach(async () => {
            // Arrange
            const usuarioPremium = UserMother.umUsuarioPremium();
            carrinho = new CarrinhoBuilder()
                .comUser(usuarioPremium)
                .comItens([new Item('Fone de ouvido', 120), new Item('Mouse', 80)]) // R$ 200,00
                .build();

            // Stubs: controlam o fluxo devolvendo respostas fixas
            gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const pedidoSalvo = new Pedido(123, carrinho, 180, 'PROCESSADO');
            repositoryStub = { salvar: jest.fn().mockResolvedValue(pedidoSalvo) };

            // Mock: queremos verificar SE e COMO ele foi chamado
            emailMock = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);

            // Act
            pedido = await checkoutService.processarPedido(carrinho, cartao);
        });

        it('deve cobrar no gateway o valor com 10% de desconto (R$ 180,00)', () => {
            // Assert (comportamento)
            expect(gatewayStub.cobrar).toHaveBeenCalledTimes(1);
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, cartao);
        });

        it('deve enviar 1 e-mail de confirmação com destinatário e mensagem corretos', () => {
            // Assert (comportamento)
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'premium@email.com',
                'Seu Pedido foi Aprovado!',
                'Pedido 123 no valor de R$180'
            );
        });

        it('deve retornar o pedido salvo pelo repositório', () => {
            // Assert (estado)
            expect(pedido.id).toBe(123);
            expect(pedido.totalFinal).toBe(180);
        });
    });

    describe('quando o envio de e-mail falha', () => {
        it('não deve falhar o checkout e ainda deve retornar o pedido salvo', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder().build();
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const pedidoSalvo = new Pedido(7, carrinho, 100, 'PROCESSADO');
            const repositoryStub = { salvar: jest.fn().mockResolvedValue(pedidoSalvo) };
            const emailStub = { enviarEmail: jest.fn().mockRejectedValue(new Error('SMTP fora do ar')) };
            jest.spyOn(console, 'error').mockImplementation(() => {});

            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailStub);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, cartao);

            // Assert
            expect(pedido).toBe(pedidoSalvo);

            console.error.mockRestore();
        });
    });
});
