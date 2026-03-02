import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { ChatWidgetComponent } from './app/chat-widget/chat-widget.component';

/**
 * Inicializa o widget como Web Component (Custom Element)
 * Compatível com qualquer HTML, incluindo framesets.
 */
(async () => {
  try {
    // Criar aplicação Angular
    const app = await createApplication({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations()
      ]
    });

    // Converter componente para Custom Element
    const chatWidgetElement = createCustomElement(ChatWidgetComponent, {
      injector: app.injector
    });

    // Registar Custom Element
    if (!customElements.get('cedsif-chatbot')) {
      customElements.define('cedsif-chatbot', chatWidgetElement);
      console.log('✅ CEDSIF Chatbot Widget carregado com sucesso!');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar CEDSIF Chatbot Widget:', error);
  }
})();
