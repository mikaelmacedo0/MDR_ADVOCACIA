import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';

describe('Fluxo de Abertura do Sistema e Telas de Login', () => {
  beforeEach(() => {
    // Limpar o sessionStorage antes de cada teste para simular abertura limpa do sistema
    sessionStorage.clear();
  });

  it('1. Deve abrir inicialmente na tela de login oficial (LoginPage)', () => {
    render(<App />);

    // Verifica que o título do sistema está presente na tela de login
    expect(screen.getByText('JurisAcompanha')).toBeInTheDocument();
    expect(
      screen.getByText('Acompanhamento Processual Jurídico com Isolamento Multi-Tenant Estrito')
    ).toBeInTheDocument();

    // Verifica presença das abas de acesso
    expect(screen.getByText('Equipe do Escritório (Admin)')).toBeInTheDocument();
    expect(screen.getByText('Portal do Cliente')).toBeInTheDocument();
    expect(screen.getByText('Autenticação Corporativa')).toBeInTheDocument();
  });

  it('2. Deve permitir login de administrador (1-clique) e abrir o painel de gestão jurídica', async () => {
    render(<App />);

    // Clica no acesso rápido de Dr. Carlos Silva
    const quickAdminBtn = screen.getByText('Dr. Carlos Silva');
    fireEvent.click(quickAdminBtn);

    // Deve exibir o painel do escritório
    await waitFor(() => {
      expect(screen.getByText('Painel de Gestão Jurídica')).toBeInTheDocument();
    });

    // Deve salvar estado de autenticação no sessionStorage
    expect(sessionStorage.getItem('juris_authenticated')).toBe('true');
  });

  it('3. Deve permitir alternar para a aba Portal do Cliente e autenticar cliente Mariana Oliveira', async () => {
    render(<App />);

    // Alterna para a aba do cliente
    const clientTabBtn = screen.getByText('Portal do Cliente');
    fireEvent.click(clientTabBtn);

    expect(screen.getByText('Acompanhe seu Processo')).toBeInTheDocument();
    expect(screen.getByText('Continuar com o Google (Gmail)')).toBeInTheDocument();

    // Clica no acesso rápido de Mariana Oliveira
    const quickClientBtn = screen.getByText('Mariana Oliveira da Costa');
    fireEvent.click(quickClientBtn);

    // Deve abrir o portal do cliente em linguagem simplificada
    await waitFor(() => {
      expect(screen.getByText('Portal do Cliente • Acompanhamento Descomplicado')).toBeInTheDocument();
      expect(screen.getByText(/Olá, Mariana!/i)).toBeInTheDocument();
    });
  });

  it('4. Ao clicar em Desconectar, deve retornar para a tela de login inicial', async () => {
    render(<App />);

    // Login rápido de administrador
    fireEvent.click(screen.getByText('Dr. Carlos Silva'));

    await waitFor(() => {
      expect(screen.getByText('Painel de Gestão Jurídica')).toBeInTheDocument();
    });

    // Clica no botão Desconectar do cabeçalho
    const logoutBtn = screen.getByTitle('Encerrar sessão e voltar para a tela de login');
    fireEvent.click(logoutBtn);

    // Deve retornar para a tela de login
    await waitFor(() => {
      expect(screen.getByText('Autenticação Corporativa')).toBeInTheDocument();
    });

    // SessionStorage deve ter sido limpo
    expect(sessionStorage.getItem('juris_authenticated')).toBeNull();
  });
});
