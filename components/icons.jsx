// Ponto unico de icones do app (Lucide). Todo icone da interface sai daqui, com
// o mesmo tamanho base e a mesma espessura de traco — e o traco uniforme que faz
// o conjunto ler como sistema, e nao como figurinhas soltas.
//
// Os nomes sao semanticos (o papel na tela), nao o nome do desenho: trocar o
// icone de "aulas" no futuro e mexer em uma linha, sem cacar import pelo codigo.
// Import por arquivo, e nao pelo barrel ('lucide-react'): o barrel exporta ~2000
// icones e o worker de build do Next estoura a pilha ao carrega-lo no Windows
// (build worker exited with code: 3221226505). Puxando so o arquivo do icone o
// build passa e o bundle fica menor.
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock.mjs';
import ChartColumn from 'lucide-react/dist/esm/icons/chart-column.mjs';
import Check from 'lucide-react/dist/esm/icons/check.mjs';
import Download from 'lucide-react/dist/esm/icons/download.mjs';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link.mjs';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle.mjs';
import PencilLine from 'lucide-react/dist/esm/icons/pencil-line.mjs';
import Printer from 'lucide-react/dist/esm/icons/printer.mjs';
import CircleAlert from 'lucide-react/dist/esm/icons/circle-alert.mjs';
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check.mjs';
import CirclePlay from 'lucide-react/dist/esm/icons/circle-play.mjs';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list.mjs';
import Clock from 'lucide-react/dist/esm/icons/clock.mjs';
import Ellipsis from 'lucide-react/dist/esm/icons/ellipsis.mjs';
import Eye from 'lucide-react/dist/esm/icons/eye.mjs';
import House from 'lucide-react/dist/esm/icons/house.mjs';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle.mjs';
import Lock from 'lucide-react/dist/esm/icons/lock.mjs';
import LogOut from 'lucide-react/dist/esm/icons/log-out.mjs';
import Mail from 'lucide-react/dist/esm/icons/mail.mjs';
import Medal from 'lucide-react/dist/esm/icons/medal.mjs';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone.mjs';
import Play from 'lucide-react/dist/esm/icons/play.mjs';
import Radio from 'lucide-react/dist/esm/icons/radio.mjs';
import Search from 'lucide-react/dist/esm/icons/search.mjs';
import Star from 'lucide-react/dist/esm/icons/star.mjs';
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert.mjs';
import Trophy from 'lucide-react/dist/esm/icons/trophy.mjs';
import Zap from 'lucide-react/dist/esm/icons/zap.mjs';

// 1.75 e um pouco mais fino que o padrao da Lucide (2): casa melhor com o peso
// da Inter nos textos de apoio e tira o ar "grosso" de icone de app generico.
//
// Por padrao o icone e decorativo (aria-hidden) — o texto ao lado ja diz o que
// ele significa. Quando o icone e a UNICA informacao (medalha do podio), quem
// chama passa aria-label e ai ele vira conteudo pro leitor de tela.
function icone(Desenho) {
  return function Icone({ className = '', ...props }) {
    const rotulado = !!props['aria-label'];
    return (
      <Desenho
        size={18}
        strokeWidth={1.75}
        aria-hidden={rotulado ? undefined : 'true'}
        role={rotulado ? 'img' : undefined}
        {...props}
        className={`ht-ico ${className}`.trim()}
      />
    );
  };
}

// Navegacao
export const IcoHome = icone(House);
export const IcoAulas = icone(CirclePlay);
export const IcoRanking = icone(Trophy);
export const IcoSair = icone(LogOut);
export const IcoAvancar = icone(ArrowRight);
export const IcoVoltar = icone(ArrowLeft);

// Estado das aulas
export const IcoConcluida = icone(CircleCheck);
export const IcoAssistir = icone(Play);
export const IcoBloqueada = icone(Lock);
export const IcoCheck = icone(Check);
export const IcoRelogio = icone(Clock);

// Gamificacao
export const IcoTrofeu = icone(Trophy);
export const IcoMedalha = icone(Medal);
export const IcoPontos = icone(Zap);
export const IcoEstrela = icone(Star);
export const IcoReticencias = icone(Ellipsis);

// Avisos e feedback
export const IcoLive = icone(Radio);
export const IcoUrgente = icone(TriangleAlert);
export const IcoFicha = icone(ClipboardList);
export const IcoAviso = icone(Megaphone);
export const IcoContagem = icone(CalendarClock);
export const IcoErro = icone(CircleAlert);
export const IcoCarregando = icone(LoaderCircle);

// Formularios
export const IcoEmail = icone(Mail);
export const IcoSenha = icone(Lock);

// Painel interno (admin)
export const IcoMetricas = icone(ChartColumn);
export const IcoBusca = icone(Search);
export const IcoOlho = icone(Eye);

// Cronograma, exercicios e suporte
// (a versao instalada da Lucide nao tem o glifo do YouTube; o play circulado
// cumpre o papel de "assistir" sobre a thumb)
export const IcoYoutube = icone(CirclePlay);
export const IcoExercicio = icone(PencilLine);
export const IcoExterno = icone(ExternalLink);
export const IcoBaixar = icone(Download);
export const IcoImprimir = icone(Printer);
export const IcoWhats = icone(MessageCircle);
