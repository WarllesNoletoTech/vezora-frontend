'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {BadgeCheck,CheckCircle2,Copy,CreditCard,LockKeyhole,RefreshCw,ShieldCheck,Wallet,ArrowLeft} from 'lucide-react';
import Brand from '@/components/Brand';
import SubscriptionPaymentSecurity from '@/components/SubscriptionPaymentSecurity';
import {waitForMercadoPagoDeviceId} from '@/lib/mercadoPagoDevice';
import {api,brl} from '@/lib/api';

type Billing={status:string;trialEndsAt:string|null;subscriptionEndsAt:string|null;daysRemaining:number;monthlyPriceCents:number;firstMonthPriceCents:number;renewalPriceCents:number;nextPaymentCents:number;isFirstMonth:boolean;additionalProfessionalCents:number;professionalCount:number;pendingProfessionalCount:number;paidProfessionalSlots:number;pixConfigured:boolean;cardConfigured:boolean};
type Addons={pending:{id:string;name:string;role:string}[];proratedCents:number;subscriptionEndsAt:string|null;additionalProfessionalCents:number;paidProfessionalSlots:number};
type Pix={invoiceId:string;amountCents:number;qrCode:string;qrCodeBase64:string;ticketUrl:string;expiresAt:string};
type Card={configured:boolean;status:string;checkoutUrl:string|null;amountCents:number|null;preapprovalId:string|null};
const date=(value:string|null)=>value?new Date(value).toLocaleDateString('pt-BR'):'—';
export default function Subscription(){
 const router=useRouter();
 const [document,D]=useState(''),[state,S]=useState<Billing|null>(null),[invoice,I]=useState<Pix|null>(null);
 const [card,CARD]=useState<Card|null>(null),[method,METHOD]=useState<'pix'|'card'>('pix');
 const [addons,ADDONS]=useState<Addons|null>(null),[invoiceKind,KIND]=useState<'BASE'|'ADDON'>('BASE');
 const [loading,L]=useState(true),[busy,B]=useState(false),[error,E]=useState(''),[notice,N]=useState('');
 const load=useCallback(async()=>{
  try{
   const me=await api<{user:{role:string};onboardingRequired:boolean}>('/me');
   if(me.user.role==='SUPERADMIN'){router.replace('/admin');return;}
   if(me.onboardingRequired){router.replace('/atualizar-cadastro');return;}
   const [billing,cardInfo,addonInfo]=await Promise.all([api<Billing>('/billing/status'),api<Card>('/billing/card/status').catch(()=>null),api<Addons>('/billing/addons').catch(()=>null)]);
   S(billing);if(cardInfo)CARD(cardInfo);if(addonInfo)ADDONS(addonInfo);
  }catch(e){if((e as Error).message.includes('Entre na sua conta'))router.replace('/entrar');else E((e as Error).message)}
  finally{L(false)}
 },[router]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{if(!invoice)return;const timer=window.setInterval(async()=>{try{const x=await api<Billing&{paymentStatus:string}>(`/billing/check/${invoice.invoiceId}`,{method:'POST'});if(x.paymentStatus==='PAID'){I(null);S(x);if(invoiceKind==='ADDON'){N('Adicional aprovado e profissional liberado.');void load();}else if(x.status==='ACTIVE'){router.replace('/painel?payment=confirmed');}}}catch{}},12000);return()=>clearInterval(timer)},[invoice,invoiceKind,router,load]);
 useEffect(()=>{if(typeof window==='undefined'||new URLSearchParams(window.location.search).get('cartao')!=='retorno')return;
  N('Você voltou do Mercado Pago. Vamos conferir o status do cartão e os pagamentos aprovados.');
  void refreshCard();
  let tries=0;const timer=window.setInterval(()=>{if(++tries>=12){window.clearInterval(timer);return;}void refreshCard()},5000);
  return()=>window.clearInterval(timer);
 },[]); // eslint-disable-line react-hooks/exhaustive-deps
 async function createPix(){B(true);E('');N('');try{const deviceId=await waitForMercadoPagoDeviceId();KIND('BASE');I(await api<Pix>('/billing/pix',{method:'POST',body:JSON.stringify({document,...(deviceId?{deviceId}:{})})}))}catch(e){E((e as Error).message)}finally{B(false)}}
 async function confirmPix(){if(!invoice)return;B(true);E('');try{const x=await api<Billing&{paymentStatus:string}>(`/billing/check/${invoice.invoiceId}`,{method:'POST'});S(x);if(x.paymentStatus==='PAID'){I(null);if(invoiceKind==='ADDON'){N('Adicional aprovado! Profissional ativado.');await load();}else if(x.status==='ACTIVE'){router.replace('/painel?payment=confirmed');}}else N('Pagamento ainda pendente. A ativação depende da confirmação do Mercado Pago.')}catch(e){E((e as Error).message)}finally{B(false)}}
 async function createAddonPix(professionalId:string){B(true);E('');N('');try{
  const deviceId=await waitForMercadoPagoDeviceId();
  const result=await api<Pix&{activated?:boolean}>(`/billing/addons/${encodeURIComponent(professionalId)}/pix`,{method:'POST',body:JSON.stringify({document,...(deviceId?{deviceId}:{})})});
  if(result.activated){N('Profissional ativado sem cobrança adicional para o tempo restante.');await load();}
  else{KIND('ADDON');METHOD('pix');I(result);}
 }catch(e){E((e as Error).message)}finally{B(false)}}
 async function startCard(){B(true);E('');N('');try{const x=await api<{checkoutUrl:string}>('/billing/card/start',{method:'POST'});if(!/^https:\/\/[^/]*mercadopago\.com(?:\.br)?\//.test(x.checkoutUrl))throw new Error('O Mercado Pago retornou um link de autorização inválido.');sessionStorage.setItem('vezora-card-before',state?.subscriptionEndsAt||'');sessionStorage.setItem('vezora-card-started',String(Date.now()));window.location.assign(x.checkoutUrl)}catch(e){E((e as Error).message);B(false)}}
 async function refreshCard(){B(true);E('');try{const c=await api<Card>('/billing/card/status');CARD(c);const billing=await api<Billing>('/billing/status');S(billing);const before=sessionStorage.getItem('vezora-card-before')||'';const initiated=Number(sessionStorage.getItem('vezora-card-started')||0);const renewed=initiated>0&&Date.now()-initiated<7*86400000 && billing.status==='ACTIVE' && c.status==='AUTHORIZED' && !!billing.subscriptionEndsAt && (!before || new Date(billing.subscriptionEndsAt).getTime()>new Date(before).getTime()+60000);if(renewed && new URLSearchParams(window.location.search).get('cartao')==='retorno'){sessionStorage.removeItem('vezora-card-before');sessionStorage.removeItem('vezora-card-started');router.replace('/painel?payment=confirmed');return;}N(billing.status==='ACTIVE'?'Pagamento confirmado: assinatura ativa.':c.status==='AUTHORIZED'?'Cartão autorizado. Aguardando a aprovação da cobrança pelo Mercado Pago.':'Status atualizado. Acesso somente após pagamento aprovado.');}catch(e){E((e as Error).message)}finally{B(false)}}
 async function cancelCard(){if(!window.confirm('Cancelar a renovação automática no cartão? Um período já pago continuará válido até seu vencimento.'))return;B(true);E('');try{await api('/billing/card/cancel',{method:'POST'});await refreshCard();N('Renovação automática cancelada.');}catch(e){E((e as Error).message)}finally{B(false)}}
 if(loading)return <div className="screen-loading"><span className="spinner"/><p>Verificando assinatura do Vezora...</p></div>;
 const active=state?.status==='ACTIVE';const trial=state?.status==='TRIAL';const suspended=state?.status==='SUSPENDED';
 return <main className="subscription-page"><SubscriptionPaymentSecurity/><section className="subscription-card subscription-card-wide">
  <div className="subscription-top"><Brand/><Link href="/painel" className="subscription-back"><ArrowLeft size={15}/> Voltar ao painel</Link></div>
  <div className="subscription-icon"><LockKeyhole size={26}/></div>
  <h1>Minha assinatura Vezora</h1>
  <p>Controle o acesso ao sistema e escolha o pagamento. O dinheiro da assinatura vai para a plataforma Vezora, não para a conta de sinais do seu estabelecimento.</p>
  <div className="subscription-status" role="status"><BadgeCheck size={19}/><div><b>{active?'Assinatura ativa':trial?'Teste grátis em andamento':suspended?'Estabelecimento suspenso':'Assinatura pendente ou vencida'}</b><small>{active?`Vencimento: ${date(state?.subscriptionEndsAt||null)}`:trial?`Teste até ${date(state?.trialEndsAt||null)} · ${state?.daysRemaining} dia(s) restante(s)`:suspended?'Contate a administração do Vezora.':'Escolha Pix ou cartão para continuar.'}</small></div></div>
  <div className="subscription-price"><span>{state?.isFirstMonth?'Primeiro mês da assinatura':'Renovação do plano Vezora'} · {state?.professionalCount??1} profissional(is)</span><strong>{state?.nextPaymentCents?brl(state.nextPaymentCents):'A definir'}</strong><small>Próxima mensalidade normal: {state?brl(state.renewalPriceCents):'—'}. Profissional adicional: {state?brl(state.additionalProfessionalCents):'—'} por mês. O primeiro profissional está incluso.</small></div>
  <div className="signup-trial"><ShieldCheck size={18}/> O Vezora não recebe nem armazena número ou código de segurança do cartão. O pagamento acontece no Mercado Pago.</div>
  {active&&addons&&addons.pending.length>0&&<section className="vezora-addon-panel">
    <h2>Profissionais aguardando ativação</h2>
    <p>O adicional é proporcional ao período restante até {date(addons.subscriptionEndsAt)}. A renovação futura inclui o valor mensal por profissional ativo.</p>
    {addons.pending.map(pro=><div className="vezora-addon-row" key={pro.id}><div><b>{pro.name}</b><small>Adicional proporcional: {brl(addons.proratedCents)}</small></div>
      <button className="btn btn-outline btn-small" type="button" disabled={busy||!!invoice||![11,14].includes(document.replace(/\D/g,'').length)} onClick={()=>void createAddonPix(pro.id)}>
       <Wallet size={16}/>{addons.proratedCents>0?'Pagar e ativar':'Ativar'}
      </button>
    </div>)}
    <p className="muted">Informe o CPF/CNPJ na opção Pix abaixo para habilitar o pagamento do adicional.</p>
   </section>}
  {suspended?<div className="alert error">Seu estabelecimento está suspenso. Solicite a liberação ao administrador.</div>:<>
   <div className="payment-methods" role="group" aria-label="Escolha a forma de pagamento">
    <button type="button" className={method==='pix'?'payment-method selected':'payment-method'} onClick={()=>{METHOD('pix');E('');}}><Wallet size={22}/><span><b>Pix</b><small>Pagamento avulso · confirmação automática</small></span></button>
    <button type="button" className={method==='card'?'payment-method selected':'payment-method'} onClick={()=>{METHOD('card');E('');}}><CreditCard size={22}/><span><b>Cartão de crédito</b><small>Cadastro no Mercado Pago · cobrança recorrente</small></span></button>
   </div>
   {method==='pix'&&<div className="payment-content">
    {!state?.pixConfigured?<div className="alert info">Pix indisponível: confira o preço no painel administrativo e as credenciais Mercado Pago de assinaturas no Heroku.</div>
    :!invoice?<div className="form-grid"><label>CPF ou CNPJ do pagador<input value={document} onChange={e=>D(e.target.value)} inputMode="numeric" maxLength={18} placeholder="Somente números"/></label><button className="btn btn-primary wide" disabled={busy||![11,14].includes(document.replace(/\D/g,'').length)} onClick={createPix}><Wallet size={18}/>{busy?'Gerando...':'Gerar Pix da assinatura'}</button><small className="muted">O documento é usado apenas na operação de pagamento, sem salvar no cadastro do Vezora.</small></div>
    :<div className="pix-box"><b>Escaneie o QR Code ou copie o código Pix</b>{invoice.qrCodeBase64&&<img className="pix-qr" src={`data:image/png;base64,${invoice.qrCodeBase64}`} alt="QR Code Pix do pagamento Vezora"/>}<label>Pix copia e cola<textarea readOnly rows={4} value={invoice.qrCode}/></label><button className="btn btn-primary wide" onClick={()=>navigator.clipboard.writeText(invoice.qrCode).then(()=>N('Código Pix copiado')).catch(()=>E('Selecione o código e copie manualmente.'))}><Copy size={17}/> Copiar Pix</button>{invoice.ticketUrl&&<a className="btn btn-outline wide" href={invoice.ticketUrl} target="_blank" rel="noreferrer">Abrir pagamento Mercado Pago</a>}<button className="btn btn-outline wide" disabled={busy} onClick={confirmPix}><RefreshCw size={17}/> Já paguei — verificar</button></div>}
   </div>}
   {method==='card'&&<div className="payment-content card-subscription-content">
    {!state?.cardConfigured?<div className="alert info">Cartão indisponível: confira as credenciais e o webhook da aplicação de assinaturas no Heroku.</div>:<>
     <p>Você será encaminhado ao Mercado Pago para autorizar as cobranças mensais. O cadastro do cartão é feito diretamente lá.</p>
      {state?.isFirstMonth&&state.firstMonthPriceCents!==state.renewalPriceCents&&<p className="alert info">Primeiro mês promocional: escolha Pix. Depois é possível configurar o cartão para as próximas mensalidades pelo preço normal.</p>}
     {card&&['PENDING','AUTHORIZED','PAUSED'].includes(card.status)?<div className="card-state"><b>{card.status==='AUTHORIZED'?'Cartão autorizado, aguardando cobrança aprovada':card.status==='PAUSED'?'Assinatura pausada':'Autorização pendente no Mercado Pago'}</b><div className="card-actions">{card.checkoutUrl&&<a className="btn btn-primary" href={card.checkoutUrl} rel="noopener noreferrer">Continuar no Mercado Pago</a>}<button className="btn btn-outline" disabled={busy} onClick={refreshCard}><RefreshCw size={16}/> Verificar pagamento</button><button className="btn btn-outline" disabled={busy} onClick={cancelCard}>Cancelar renovação</button></div></div>:<button className="btn btn-primary wide" disabled={busy} onClick={startCard}><CreditCard size={18}/>{busy?'Conectando...':'Cadastrar cartão no Mercado Pago'}</button>}
     <small className="muted">A autorização do cartão, isoladamente, não libera o sistema. O acesso é ativado somente após pagamento aprovado.</small>
    </>}
   </div>}
  </>}
  {notice&&<div className="alert success" role="status"><CheckCircle2 size={18}/>{notice}</div>}
  {error&&<div className="alert error" role="alert">{error}</div>}
  <Link href="/painel" className="subscription-footer">Voltar ao painel</Link>
 </section></main>;
}
