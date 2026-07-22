Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver')) {
    return false; // игнорируем только мусор
  }
});

describe('Rules Management Flow', { pageLoadTimeout: 120000 }, () => {
  before(() => {
    cy.writeFile('auth_api_status.txt', '0');
  });

  it('Авторизация -> Правила: создать папку, под папку, правило и удалить всё', () => {
    cy.viewport(1280, 800);

    const folderName = 'AutoTest_Rule';
    const subfolderName = 'test';
    const ruleName = 'testRule';

    cy.intercept('POST', '**/login**').as('apiAuth');

    cy.log('🟢 ШАГ 1: АВТОРИЗАЦИЯ И ПЕРЕХОД В РАЗДЕЛ ПРАВИЛ');
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => { win.sessionStorage.clear(); });

    cy.visit('https://b2b.metatrip.asia/sign-in', { timeout: 30000 });

    cy.env(['LOGIN_EMAIL', 'LOGIN_PASSWORD']).then((envVars) => {
      cy.get('input[type="text"]', { timeout: 15000 })
        .should('be.visible')
        .focus()
        .type(`{selectall}{backspace}${envVars.LOGIN_EMAIL}`, { delay: 50, log: false });

      cy.get('input[type="password"]')
        .should('be.visible')
        .focus()
        .type(`{selectall}{backspace}${envVars.LOGIN_PASSWORD}`, { delay: 50, log: false });

      cy.get('button.sign-in-page__submit').click({ force: true });
    });

    cy.wait('@apiAuth', { timeout: 30000 }).then((interception) => {
      const status = interception.response?.statusCode || 500;

      if (status >= 400) {
        cy.writeFile('auth_api_status.txt', `ERROR_${status}`);
        throw new Error(`Auth failed: ${status}`);
      }
    });

    cy.url({ timeout: 30000 }).should('not.include', '/sign-in');

    cy.contains('.sidebar-link', /Правила|Rules/i, { timeout: 25000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Список правил|Rule list|Rules list/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.url({ timeout: 20000 }).should('include', '/rules');

    cy.log('🟢 ШАГ 2: СОЗДАНИЕ ПАПКИ');
    cy.contains('button', /Добавить папку/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains('label', /Название папки/i, { timeout: 20000 })
      .parent()
      .find('input')
      .should('be.visible')
      .clear({ force: true })
      .type(folderName, { delay: 50, force: true })
      .should('have.value', folderName);

    cy.contains('label', /Тип услуги|Service type/i, { timeout: 20000 })
      .parent()
      .find('div.p-select, div.p-dropdown, .p-select-wrapper, .p-inputwrapper')
      .first()
      .should('be.visible')
      .click({ force: true });

    cy.contains('.p-dropdown-item, .p-select-item, [role="option"]', /Перел[её]ты|Flights/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains('.p-dialog button', /Добавить|Save|Создать/i)
      .should('be.visible')
      .click({ force: true });

    cy.wait(900);
    cy.log('🟢 ШАГ 3: ОТКРЫТИЕ ПАПКИ И СОЗДАНИЕ ПОДПАПКИ');
    cy.contains('button', folderName, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains('button', /Под папка|Подпапка|Subfolder/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains('label', /Название под папки|Название папки/i, { timeout: 20000 })
      .parent()
      .find('input')
      .should('be.visible')
      .clear({ force: true })
      .type(subfolderName, { delay: 50, force: true })
      .should('have.value', subfolderName);

    cy.contains('.p-dialog button', /Добавить|Save|Создать/i)
      .should('be.visible')
      .click({ force: true });

    cy.wait(900);
    cy.log('🟢 ШАГ 4: ВЫБОР ПОДПАПКИ И СОЗДАНИЕ ПРАВИЛА');
    cy.contains('button.subfolder-item', subfolderName, { timeout: 20000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.contains('button.rules-add-rule-menu__btn', /Правила|Rules/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.wait(900);
    cy.contains('a.p-menu-item-link', /Поиск|Search/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('div.p-dialog:visible', { timeout: 25000 })
      .should('exist')
      .as('ruleDialog');

    cy.get('@ruleDialog').find('input:visible').first().as('ruleNameInput');
    cy.get('@ruleNameInput')
      .should('be.visible')
      .clear({ force: true })
      .type(ruleName, { delay: 80, force: true });
    cy.get('@ruleNameInput').should('have.value', ruleName);

    cy.contains(/Выберите действие|Выбрать действие|Choose action|Action/i, { timeout: 20000 })
      .should('be.visible')
      .then(($actionToggle) => {
        const clickable = $actionToggle.closest('button, [role="button"], .p-select, .p-dropdown');
        cy.wrap(clickable).click({ force: true });
      });

    cy.wait(700);
    cy.contains('button, [role="button"], .p-dropdown-item, [role="option"]', /Отключить провайдера|Disable provider/i)
      .should('be.visible')
      .click({ force: true });

    // Add provider in the action block
    cy.get('@ruleDialog')
      .find('div.rule-field-multi-select')
      .eq(0)
      .find('button.rule-field-multi-select__add-btn', { timeout: 20000 })
      .scrollIntoView({ offset: { top: -100, left: 0 } })
      .should('be.visible')
      .click({ force: true });

    cy.wait(700);
    cy.get('@ruleDialog')
      .find('div.rule-field-multi-select')
      .eq(0)
      .find('input.p-autocomplete-input', { timeout: 20000 })
      .first()
      .should('be.visible')
      .click({ force: true })
      .clear({ force: true })
      .type('AutoTestForRule', { delay: 50, force: true });

    cy.wait(900);
    cy.contains('li.p-autocomplete-item, .p-autocomplete-item, [role="option"]', /AutoTestForRule/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains(/Выберите условие|Condition/i, { timeout: 20000 })
      .should('be.visible')
      .then(($conditionToggle) => {
        const clickable = $conditionToggle.closest('button, [role="button"], .p-select, .p-dropdown, .p-inputwrapper, .p-select-wrapper');
        cy.wrap(clickable).click({ force: true });
      });

    cy.contains('li.p-select-option, .p-dropdown-item, [role="option"]', /^\s*(Провайдер|Provider)\s*$/i, { timeout: 20000 })
      .scrollIntoView({ offset: { top: 0, left: 0 } })
      .should('be.visible')
      .click({ force: true });

    // Add provider in the condition block
    cy.get('@ruleDialog')
      .find('div.rule-field-multi-select')
      .eq(1)
      .find('button.rule-field-multi-select__add-btn', { timeout: 20000 })
      .scrollIntoView({ offset: { top: -100, left: 0 } })
      .should('be.visible')
      .click({ force: true });

    cy.get('@ruleDialog')
      .find('div.rule-field-multi-select')
      .eq(1)
      .find('input.p-autocomplete-input', { timeout: 20000 })
      .first()
      .should('be.visible')
      .click({ force: true })
      .clear({ force: true })
      .type('AutoTestForRule', { delay: 50, force: true });

    cy.wait(900);
    cy.contains('li.p-autocomplete-item, .p-autocomplete-item, [role="option"]', /AutoTestForRule/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('button.app-button.app-button--primary, button.app-button--primary')
      .contains(/Создать|Create/i)
      .scrollIntoView({ offset: { top: -100, left: 0 } })
      .should('be.visible')
      .click({ force: true });

    cy.wait(1100);
    cy.contains(ruleName, { timeout: 20000 }).should('exist');

    cy.log('🟢 ШАГ 5: УДАЛЕНИЕ ПРАВИЛА');
    cy.contains(ruleName, { timeout: 20000 })
      .parents()
      .find('button.subfolder-rule__icon-btn[title="Удалить"], button[title="Удалить"]')
      .first()
      .click({ force: true });

    cy.get('.app-confirm-modal__button button, button.app-button--primary.app-confirm-modal__button, .p-dialog button')
      .contains(/Удалить|Delete/i)
      .click({ force: true });
    cy.contains(ruleName).should('not.exist');

    cy.log('🟢 ШАГ 6: УДАЛЕНИЕ ПАПКИ');
    cy.contains('button.root-folder-item, .root-folder-item', folderName, { timeout: 20000 })
      .should('be.visible')
      .within(() => {
        cy.get('span.root-folder-item__menu, button[title="Меню"], button[aria-label="menu"], button[aria-label="Меню"]')
          .filter(':visible')
          .first()
          .click({ force: true });
      });

    cy.contains('.p-menu-item-link, .p-menu-item, li', /Удалить|Delete/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('button.app-button--primary, .app-confirm-modal__button button, .p-dialog button', { timeout: 20000 })
      .contains(/Удалить|Delete/i)
      .should('be.visible')
      .click({ force: true });

    cy.contains(folderName).should('not.exist');
  });
});
