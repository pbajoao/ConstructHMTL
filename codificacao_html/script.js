var Telas = {
	totalDeTelas : 0,
    /*carregador*/
    carregar : function(){
        var $container = $('.container:eq(0)');
		
		Telas.totalDeTelas = $container.children('.tela').size();
        Sumario.criar($container);
        Glossario.criar();
        ComboDeTelas.criar();
        
        if(SCORMFunctions.scormIsLoaded()){
            if(doLMSGetValue('cmi.core.entry') != 'ab-initio'){
                Telas.definirTelaDePartida($container);
            }
			SCORM.aplicarNomeDoUsuario();
            doLMSSetValue("cmi.core.exit","");
        }
        
        Telas.aplicarAcoesBotoes();
        Telas.aplicarOuvinteDeProgresso();
        
        if(Telas.totalDeTelas > 0){
            setTimeout(function(){
                Telas.aplicarStatusInicialDosBotoes($container);
                Telas.aplicarEntradaEmTela($container)
            },500);
        }else{
            console.log('Não há telas para exibir.')
        }
    },
    /*metodos*/
    aplicarAcoesBotoes : function(){//método executado no carregamento
        $('.bt-avancar').on('click', Telas.onAvancar);
        $('.bt-tocarpausar').on('click', Telas.onTocarPausar);
        $('.bt-retroceder').on('click', Telas.onRetroceder);
        $('.bt-recarregar').on('click', Telas.onRecarregar);
        $('.bt-audio').on('click', Telas.onControlarAudio);
        //$('.bt-avancar-duploclique').on('dblclick', Telas.onAvancarDblClick);
        $('.combo-pular').on('change', Telas.onPularPorCombo);
        
        $(document).on('click', '.bt-pular', Telas.onPular); 
        
        $(document).keydown(function(e){
            
            if(e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREAS'){
                var $container = $('.container:eq(0)');
                switch (e.keyCode) {
                    case 35:
                        e.preventDefault();
                        Telas.pularParaTela($container,Telas.totalDeTelas-1);
                        break;
                    case 36:
                        e.preventDefault();
                        Telas.pularParaTela($container,0);
                        break;
                    case 37:
                        e.preventDefault();
                        Telas.retrocederTela($container);
                        break;
                    case 38:
                        e.preventDefault();
                        Telas.recarregarTela($container);
                        break;
                    case 39:
                        e.preventDefault();
                        Telas.avancarTela($container);
                        break;
                    case 80:
                        var $botaoPausa = $('.principal:eq(0)').children('.controles:eq(0)').children('.bt-tocarpausar:eq(0)');
                        Telas.tocarPausarTela($container,$botaoPausa);
                        break;
                }
            }
        });
        
        $(document).on('click', '.bt-box-sair', function(e){
            Telas.ocultarBoxes();
            $(e.target).addClass('fora').removeClass('dentro');
            Telas.verificarPausa();
        });        
    },
    aplicarEntradaEmTela : function($container){//executado após definição da 'tela atual'
        var $telas = $container.children('.tela');
        var numeroTela = Number($container[0].getAttribute('data-tela-atual'));
        var $tela = $telas.eq(numeroTela);
        var $audios = $tela.children(':not(.container)').find('audio');
        
        if($audios.size() > 0 && !$tela.hasClass('com-audio')){//com-audio é aplicado pelo evento oncanplay dos áudios
            $tela.addClass('sem-audio');//para não tocar áudios depois de mostrar o aviso
            Audios.montarMiniMensagem($tela);
            $audios.each(function(i){
                var $elementoPai = $(this).parent();
                
                if($elementoPai[0].style['animationDelay'].indexOf('s') != -1){
                    //força delay de .5s para elemento pai do áudio, para o caso de ter um delay maior, aguardando o fim de um áudio anterior
                    $elementoPai.addClass('delayPadrao');
                }
            });
        }

        Telas.entrarObjetosDaTela($container);//carrega os data-tipos
   
        $tela.removeClass('saida').addClass('entrada');
        
        if($container.hasClass('principal')){
            ComboDeTelas.selecionarOpcao(numeroTela);
            Sumario.marcarTelaVisitada(numeroTela);
            $('#sumario').removeClass('visivel');//fecha o sumário (caso esteja aberto)
            
            Telas.aplicarPorcentagemDePaginasVisitadas();
            
            if(SCORMFunctions.scormIsLoaded()){
                SCORM.registrarNumeroDaTela(numeroTela);
                if($tela.hasClass('finalizarModulo')){//para módulos que não tenham interação
                    SCORM.registrarModulo();
                }
            }
        }else{
            if($container.children('.ponteiros').size() > 0){
                Ponteiros.marcarPonteiro($container);//para subtelas, indica a tela atual
            }
        }
    },
    aplicarOuvinteDeProgresso : function(){//método executado no carregamento
        $('.barraProgresso span').each(function(i){
            this.addEventListener("webkitAnimationEnd", Telas.dispararAcaoDeFimDeProgresso, false);
            this.addEventListener("animationend", Telas.dispararAcaoDeFimDeProgresso, false);
        });
    },
	aplicarPorcentagemDePaginasVisitadas : function(){//aplicado ao entrar em tela
		var telasVisitadas = 0;
		if(SCORM.suspendData.visitadas.indexOf('-') != -1){
			telasVisitadas = SCORM.suspendData.visitadas.match(/-/g).length-1;
			telasVisitadas = Math.round((telasVisitadas*100)/Telas.totalDeTelas);
		}
		$('#porcentagem-modulo').html(telasVisitadas);
	},
    aplicarSaidaEmTela : function($container){//executado após definição da 'tela anterior'
        var $telas = $container.children('.tela');
        var numeroTela = Number($container[0].getAttribute('data-tela-anterior'));
        var $tela = $telas.eq(numeroTela);
        var $videos = $tela.find('video');
        //var $miniMensagem = $tela.children('.mini-mensagem');
        
        if($tela.hasClass('sem-audio')){
            $tela.removeClass('sem-audio');
            $tela.find('.delayPadrao').removeClass('delayPadrao');
        }
        
        //if($miniMensagem.size() > 0) $miniMensagem.remove();
        if($container.hasClass('principal') && $telas.eq(numeroTela).hasClass('pausa')){
            $telas.removeClass('pausa');
            $container.children('.controles:eq(0)').children('.bt-tocarpausar:eq(0)').removeClass('empausa');
        }
        
        Telas.pausarVideos($videos);
        Telas.ocultarBoxes();
        Telas.sairObjetosDaTela($container);//limpa os data-tipos
        
        $container.children('.saida').removeClass('saida');
        $container.children('.pausa').removeClass('pausa');
        
        $telas.eq(numeroTela).removeClass('entrada').addClass('saida');
    },
    aplicarStatusInicialDosBotoes : function($container){//executado no carregamento
        if($container[0].getAttribute('data-tela-atual') == 0){
            $container.children('.controles:eq(0)').children('.bt-retroceder:eq(0)').addClass('desabilitado');
        }else if($container[0].getAttribute('data-tela-atual') == Telas.totalDeTelas-1){
            $container.children('.controles:eq(0)').children('.bt-avancar:eq(0)').addClass('desabilitado');
        }
    },
    avancarTela : function($container){
        var numeroTela = Number($container[0].getAttribute('data-tela-atual'));
        var $telas = $container.children('.tela');
        var tempoTroca = $container[0].getAttribute('data-tempo-troca');
        var atraso = (tempoTroca) ? Number(tempoTroca) : 750;
        var $btRetroceder = $container.children('.controles:eq(0)').children('.bt-retroceder:eq(0)');
        var $btAvancar = $container.children('.controles:eq(0)').children('button:last-child');
        
        if($btRetroceder.hasClass('desabilitado')) $btRetroceder.removeClass('desabilitado');
        
        if(numeroTela+1 < $telas.size()){
            $container[0].setAttribute('data-tela-anterior', numeroTela);
            $container[0].setAttribute('data-tela-atual', ++numeroTela);

            Telas.aplicarSaidaEmTela($container);
            setTimeout(function(){
                Telas.aplicarEntradaEmTela($container);
                if(numeroTela == $telas.size()-1){
                    $btAvancar.addClass('desabilitado');
                }
            },atraso);
        };
    },
    definirTelaDePartida : function($container){//executado no carregamento
        var numeroTela = SCORM.obterUltimaTelaVista();
        $container[0].setAttribute('data-tela-atual',numeroTela);
    },
    desligarBarraDeProgresso : function($container){//executado na saída de tela
        var $barraProgresso = $container.find('.barraProgresso');//barra de tela e subtelas
        $barraProgresso.removeClass('acionada');//retira animação da barra
    },
    destacarBotaoDeAvanco : function($container){//executado pelo evento de fim de animacao da barra de progresso
        var $telas = $container.children('.tela');
        var numeroTela = Number($container[0].getAttribute('data-tela-atual'));
        var $tela = $telas.eq(numeroTela);
        
        if($tela.find('.dialogo').size() > 0){
            Dialogo.habilitarBotoes($tela);
        }else{
            var $btAvancar = $container.children('.controles:eq(0)').children('button:last-child');
            if(!$btAvancar.hasClass('desabilitado') && !$container.hasClass('simulacao')){
                $btAvancar.addClass('destacado');
            }
        }
    },
    dispararAcaoDeFimDeProgresso : function(e){//evento executado no fim da animação da barra de progresso
        var $container = $(e.target).closest('.container');
        if($container.hasClass('principal')){
            Telas.destacarBotaoDeAvanco($container);
        }else{//container filho
            if($container[0].getAttribute('data-possui-controles') == '0'){
                Telas.avancarTela($container);
            }else{
                Telas.destacarBotaoDeAvanco($container);
            }
            if(Number($container[0].getAttribute('data-tela-atual')) == $container.children('.tela').size()-1 && !$container.hasClass('simulacao')){
                $container.parent().parent().children('.barraProgresso:eq(0)').removeClass('pausada').removeClass('progresso-bloqueado');
            }
        }
    },
    dispararInicioDeAudio : function(e){//evento executado no fim da animação de um elemento de tela que possua áudio
        var $itemDeTela = $(e.currentTarget);//usando currentTarget para evitar bubbling
        var $tela = $itemDeTela.closest('article.tela');
        var $barraProgresso = $tela.parent().children('.barraProgresso:eq(0)');
        var $audio = $itemDeTela.children('audio:eq(0)');
        if($tela.hasClass('entrada') && !$tela.hasClass('sem-audio') && !$itemDeTela.hasClass('fora')){
            if(!$barraProgresso.hasClass('pausada')){
                Telas.tocarAudio($audio);
            }else{
                $audio[0].setAttribute('data-status','pausado');
            }
        }
    }, 
    entrarBarraDeProgresso : function($container){
        var $telas = $container.children('.tela');
        var numeroTela = Number($container[0].getAttribute('data-tela-atual'));
        var $tela = $telas.eq(numeroTela);
        var $barraProgresso = $container.children('.barraProgresso:eq(0)');
        var dataTempo = ($('.principal:eq(0)').hasClass('mudo') || !$tela.hasClass('com-audio')) ? 'data-tempo-tela-mudo' : 'data-tempo-tela';
        var tempo =  (Number($tela[0].getAttribute(dataTempo))/1000)+'s';
        var $span = $barraProgresso.children('span:eq(0)');
        
        $barraProgresso.addClass('acionada');
        $span[0].style.animationDuration = tempo;
    },
    entrarObjetosDaTela : function($container){
        var $telas = $container.children('.tela');
        var numeroTela = Number($container[0].getAttribute('data-tela-atual'));
        var $tela = $telas.eq(numeroTela);
        var $btAvancar = $container.children('.controles:eq(0)').children('button:last-child');
        var $barraProgresso = $container.children('.barraProgresso:eq(0)');
        
        if($tela.hasClass('bloquear-progresso')){
            $barraProgresso.addClass('progresso-bloqueado');
        }
        
        $btAvancar.removeClass('destacado');
        
        $tela.children().each(function(i){
            var tipo = this.getAttribute('data-tipo');
            if(tipo){
                window[tipo].entrar(this);
            }
        });
        
        /*$tela.find('audio').each(function(i){
            this.setAttribute('data-status','');
        });*/
        
        if($container.children('.barraProgresso').size() > 0) Telas.entrarBarraDeProgresso($container);
    },
    /*obterAudiosDaTela : function($tela){
        var audios = [];
        
        $tela.children(':not(.container)').each(function(i){
            $(this).find('audio').each(function(j){
                audios.push(this);
            });
        });
        
        var $audios = $tela.children(':not(.container)').find('audio');
        
        console.log('$audios:'+$audios.size());
        console.log('audios:'+audios.length);
        
        return audios;
    },*/
    ocultarBoxes : function(){
        $('.container-wrapper .box').each(function(i){
            if($(this).hasClass('dentro')){
                $(this).addClass('fora').removeClass('dentro');
                var $video = $(this).find('video');
                if($video.size() > 0){
                    Telas.pausarVideos($video);
                }
                var $audio = $(this).find('audio');
                if($audio.size() > 0){
                    $audio.each(function(i){
                        Telas.sairAudio($(this));
                    });
                }
            }
        });
    },
    onAvancar : function(e){
        var $container = $(e.target).closest('.container');
        Telas.avancarTela($container);
    },
    onAvancarDblClick : function(e){
        e.stopPropagation();
        e.preventDefault();
        var $container = $(e.target).closest('.container');
        Telas.avancarTela($container);
    },
    onControlarAudio: function(e){
        var $btAudio = $(e.target);
        var $audios = $('.principal:eq(0)').find('audio');//troquei o $('audio')
        var $container;
        
        if($audios.size() > 0){
            if(!$btAudio.hasClass('mudo-acionado')){
                $('.principal:eq(0)').addClass('mudo');
                
                $audios.each(function(i){
                    var $elementoPai = $(this).parent();
                    
                    if($elementoPai[0].style['animationDelay'].indexOf('s') != -1){
                        $elementoPai.addClass('mudo');
                    }
                    
                    this.muted = true;
                });
                
                $btAudio.addClass('mudo-acionado');
            }else{
                $container = $btAudio.closest('.container');
                
                $('.mudo').removeClass('mudo');//.principal e elementos com áudio interno
                
                $audios.each(function(i){
                    this.muted = false;
                });
                
                $btAudio.removeClass('mudo-acionado');
                
                Telas.recarregarTela($container);
            }
        }
    },
    onTocarPausar: function(e){
        var $container = $(e.target).closest('.container');
        Telas.tocarPausarTela($container,$(e.target));
    },
    onRetroceder: function(e){
        var $container = $(e.target).closest('.container');
        Telas.retrocederTela($container);
    },
    onRecarregar: function(e){
        var $container = $(e.target).closest('.container');
        Telas.recarregarTela($container);
    },
    onPular: function(e){
        var alvo = e.target.getAttribute('data-alvo');
        var $container = (alvo) ? $(alvo) : $(e.target).closest('.container');
        var numeroPulo = e.target.getAttribute('data-pulo');
        var fCallback = e.target.getAttribute('data-callback');
        
        Telas.pularParaTela($container,numeroPulo);
        
        if(fCallback){
            Utilidades.executarCallback(fCallback);
        }
    },
    onPularPorCombo: function(e){
        var $container = $(e.target).closest('.container');
        var numeroPulo = e.target.getElementsByTagName("option")[e.target.selectedIndex].value;
        Telas.pularParaTela($container,numeroPulo);
    },
    pausarAudio : function($audio){
        $audio[0].pause();
    },
    pausarObjetosDeTela : function($container){
        var numeroTela = $container[0].getAttribute('data-tela-atual');
        var $telas = $container.children('.tela');
        var $tela = $telas.eq(numeroTela);
        
        $container.find('.barraProgresso.acionada').addClass('pausada');
        
        $tela.find('audio').each(function(i){
             Telas.pausarAudio($(this));
        });
        
        $tela.find('video').each(function(i){
            this.pause();
        });
    },
    pausarVideos : function($videos){
        if($videos.size() > 0){
            $videos.each(function(i){
                this.pause();
            });
        }
    },
    pularParaTela : function($container,numeroPulo){
        var $telas = $container.children('.tela');
        var numeroTela = $container[0].getAttribute('data-tela-atual');
        var tempoTroca = $container[0].getAttribute('data-tempo-troca');
        var atraso = (tempoTroca) ? Number(tempoTroca) : 750;
        var $btRetroceder = $container.children('.controles:eq(0)').children('.bt-retroceder:eq(0)');
        var $btAvancar = $container.children('.controles:eq(0)').children('button:last-child');
        
        $container[0].setAttribute('data-tela-anterior',numeroTela);
        $container[0].setAttribute('data-tela-atual',numeroPulo);
        
        if(numeroPulo == 0){
            $btRetroceder.addClass('desabilitado');
        }else{
            $btRetroceder.removeClass('desabilitado');
        }
        
        Telas.aplicarSaidaEmTela($container);
        setTimeout(function(){
            Telas.aplicarEntradaEmTela($container);
            if(numeroPulo == $telas.size()-1){
                $btAvancar.addClass('desabilitado');
            }else{
                $btAvancar.removeClass('desabilitado');
            }
        }, atraso);
    },
    recarregarTela : function($container){
        var numeroTela = $container[0].getAttribute('data-tela-atual');
        var tempoTroca = $container[0].getAttribute('data-tempo-troca');
        var atraso = (tempoTroca) ? Number(tempoTroca) : 1000;
        
        $container[0].setAttribute('data-tela-anterior',numeroTela);
        $container[0].setAttribute('data-tela-atual',numeroTela);
        
        Telas.aplicarSaidaEmTela($container);
        setTimeout(function(){
            Telas.aplicarEntradaEmTela($container);
        },atraso);
    },    
    retrocederTela : function($container){
        var $telas = $container.children('.tela');
        var numeroTela = Number($container[0].getAttribute('data-tela-atual'));
        var tempoTroca = $container[0].getAttribute('data-tempo-troca');
        var atraso = (tempoTroca) ? Number(tempoTroca) : 750;
        var $btRetroceder = $container.children('.controles:eq(0)').children('.bt-retroceder:eq(0)');
        var $btAvancar = $container.children('.controles:eq(0)').children('button:last-child');
        
        numeroTela = Number($container[0].getAttribute('data-tela-atual'));
        
        if($btAvancar.hasClass('desabilitado')) $btAvancar.removeClass('desabilitado');
        
        if(numeroTela-1 >= 0){
            $container[0].setAttribute('data-tela-anterior',numeroTela);
            $container[0].setAttribute('data-tela-atual',--numeroTela);
            Telas.aplicarSaidaEmTela($container);
            setTimeout(function(){
                Telas.aplicarEntradaEmTela($container);
                if(numeroTela <= 0){
                    $btRetroceder.addClass('desabilitado');
                }
            }, atraso);
        };
    },
    sairObjetosDaTela : function($container){
        var $telas = $container.children('.tela');
        var numeroTela = Number($container[0].getAttribute('data-tela-anterior'));
        var $tela = $telas.eq(numeroTela);
        
        $container.find('.pausada').removeClass('pausada');
        $container.children('.barraProgresso').removeClass('progresso-bloqueado');
        
        $tela.children().each(function(i){
            var tipo = $(this)[0].getAttribute('data-tipo');
            if(tipo){
                window[tipo].sair(this);
            }
        });
        
        $tela.find('audio').each(function(i){
            Telas.sairAudio($(this));
        });
        
        Telas.desligarBarraDeProgresso($container);
    },
    sairAudio : function($audio){
        $audio[0].setAttribute('data-status','');
        $audio[0].pause();
        if (!isNaN($audio[0].duration)) $audio[0].currentTime = 0;
    },
    tocarAudio : function($audio){
        $audio[0].play();
    },
    tocarObjetosDeTela : function($container){
        var numeroTela = $container[0].getAttribute('data-tela-atual');
        var $telas = $container.children('.tela');
        var $tela = $telas.eq(numeroTela);
        
        $container.children('.barraProgresso').removeClass('pausada');
        
        $tela.find('audio').each(function(i){
            if(this.getAttribute('data-status') == 'tocando' || this.getAttribute('data-status') == 'pausado'){
                Telas.tocarAudio($(this));
            }
        });
    },
    tocarPausarTela : function($container,$botao){
        var numeroTela = $container[0].getAttribute('data-tela-atual');
        var $telas = $container.children('.tela');
        var $tela = $telas.eq(numeroTela);
        var $barraProgresso = $container.children('.barraProgresso:eq(0)');
        var $subTela = $tela.children('.container');
        //var $spanProgresso = $barraProgresso.children().eq(0);
        
        //if($spanProgresso.width() < $barraProgresso.width()){
            if($tela.hasClass('pausa')){
                $tela.removeClass('pausa');
                $botao.removeClass('empausa');
                Telas.tocarObjetosDeTela($container);
            }else{
                $tela.addClass('pausa');
                $botao.addClass('empausa');
                Telas.pausarObjetosDeTela($container);
            }
            if($subTela.size() > 0){
                $subTela.each(function(i){
                    Telas.tocarPausarTela($(this),$botao);
                });
            }
        //}
    },
    verificarPausa : function($tela){
        var $container;
        if(!$tela){
            $container = $('.principal:eq(0)');
            var numeroTela = $container[0].getAttribute('data-tela-atual');
            var $telas = $container.children('.tela');
            var $tela = $telas.eq(numeroTela);
        }
        
        if($tela.hasClass('pausa')){
            if(!$container) $container = $('.principal:eq(0)');
            var $botaoPausa = $container.children('.controles:eq(0)').children('.bt-tocarpausar:eq(0)');
            $tela.removeClass('pausa');
            $botaoPausa.removeClass('empausa');
            Telas.tocarObjetosDeTela($container);
        }
    }
};

var Subtela = {
    carregar : function(){
        $('.subtela').each(function(i){
            Ponteiros.criar($(this));
        });
    },
    /*metodos*/
    entrar : function(container){
        var $container = $(container);
        var atraso = Number(container.getAttribute('data-inicio-em'));
        var $barraProgressoPai = $('.principal:eq(0)').children('.barraProgresso:eq(0)');
        var $telaPai = $container.parent();
        
        $barraProgressoPai.addClass('progresso-bloqueado');
        $telaPai[0].setAttribute('data-tempo-tela','1000');
        
        $container.children('.saida').addClass('saida');
        
        if(container.getAttribute('data-possui-controles') == '0'){
            $container.children('.controles').addClass('automatico');
        }
        
        setTimeout(function(){
            Telas.aplicarEntradaEmTela($container);
        }, atraso);
    },
    sair : function(container){
        var $container = $(container);
        
        $container.children('.entrada').addClass('saida').removeClass('entrada');
        
        Telas.sairObjetosDaTela($container);
    
        container.setAttribute('data-tela-atual','0');
        container.setAttribute('data-tela-anterior','');
        $container.children('.controles:eq(0)').children('.desabilitado').removeClass('desabilitado');
    },
};

var NavegacaoExterna = {
    carregar : function(){
        $('.bloco-navegacao .bt-pular').on('click',NavegacaoExterna.onPular);
    },
    entrar : function(elemento){
        $(elemento).find('.visitado').removeClass('visitado');
    },
    onPular : function(e){
         $(e.target).parent().addClass('visitado');
    },
    sair : function(elemento){},
};

var Simulacao = {
    /*carregador*/
    carregar : function(){
        Simulacao.aplicarAcoesBotoes();
    },
    acionarEtapa:function($capsula){
        var $tela, etapas, $etapa, etapaNum, posicaoEtapa, $orientacao, fCallback;
        
        $etapas = $capsula.children('.etapa');
        etapaNum = Number($capsula[0].getAttribute('data-etapa'));
        
        if(etapaNum <= $etapas.size()-1){
            
            $capsula.find('.etapa-atual').removeClass('etapa-atual');
            
            $etapa = $etapas.eq(etapaNum);
            
            fCallback = $etapa[0].getAttribute('data-callback');
            
            if(fCallback){
                Utilidades.executarCallback(fCallback);
            }
            
            $etapa.addClass('etapa-atual');
            
            posicaoEtapa = {
                left: $capsula[0].posicaoAlvo.left - ($etapa.position().left + ($etapa.width()*.5)), 
                top: $capsula[0].posicaoAlvo.top - ($etapa.position().top + ($etapa.height()*.5)),
            };
            
            $capsula.css({
                top:posicaoEtapa.top,
                left:posicaoEtapa.left
            });
            
            $orientacao = $capsula.children('.orientacao:eq(0)');
            $orientacao.addClass('invisivel');
            
            setTimeout(function(){Simulacao.definirOrientacao($orientacao,$etapa)},500);
            
            $capsula[0].setAttribute('data-etapa',etapaNum+1);
            
            
        }
    },
    aplicarAcoesBotoes : function(){
        $('.simulacao .bt-avancar').on('click', Simulacao.onAvancar);
        $('.simulacao .bt-retroceder').on('click', Simulacao.onRetroceder);
        $('.simulacao .bt-recarregar').on('click', Simulacao.onRecarregar);
        $('.simulacao .bt-pular').on('click', Simulacao.onPular);
        
        $('.simulacao input.bt-validar').keypress(function(e){
            if ($.data(this, '_lastKeyEvent') != 'keydown') {
                if(e.keyCode == 13) {
                    Simulacao.validarEntradas(e.target);        
                }
            }
            $.data(this, '_lastKeyEvent', 'keypress');
        }).keydown(function(e) {
            if(e.keyCode == 13) {
                Simulacao.validarEntradas(e.target);        
            }
            $.data(this, '_lastKeyEvent', 'keydown');
        });
        
        $('.simulacao button.bt-validar').click(function(e){
            Simulacao.validarEntradas(e.target);        
        });
        
        $('.simulacao input.bt-etapa').keypress(function(e){
            if ($.data(this, '_lastKeyEvent') != 'keydown') {
                if(e.keyCode == 13) {
                    Simulacao.validarInput(e.target);
                }
            }
            $.data(this, '_lastKeyEvent', 'keypress');
        }).keydown(function(e) {
            if(e.keyCode == 13) {
                Simulacao.validarInput(e.target);
            }
            $.data(this, '_lastKeyEvent', 'keydown');
        });
        
        $('.simulacao button.bt-etapa').click(function(e){
            var $capsula;
            if($(this).hasClass('avancar')){
                var $container = $(e.target).closest('.container');
                Telas.avancarTela($container);
                setTimeout(function(){
                    $capsula = Simulacao.obterCapsula($container);
                    Simulacao.tratarObjetosDaSimulacao($container);
                    Simulacao.acionarEtapa($capsula);
                });
            }else{
                $capsula = $(e.target).parent();
                Simulacao.acionarEtapa($capsula);
            }
        });
    },

    definirEtapas : function($container){
        $container.find('.etapa').each(function(i){
            var dimensao = this.getAttribute('data-dimensao').split(',');
            var posicao = this.getAttribute('data-posicao').split(',');
            $(this).css({
                width:dimensao[0]+'px',
                height:dimensao[1]+'px',
                left:posicao[0]+'px',
                top:posicao[1]+'px',
            });
        });
    },
    definirOrientacao : function($orientacao,$etapa){
        /*$orientacao.html($etapa[0].getAttribute('data-orientacao')).css({
            top : ($etapa.position().top - $orientacao.outerHeight() - 8) + 'px',
            left : ($etapa.position().left-(parseInt($orientacao.outerWidth()-$etapa.outerWidth())/2)) +'px',
        }).removeClass('invisivel').addClass('emcima');*/
    
        var $tela = $orientacao.closest('.tela');
        var orientacao = $orientacao[0];
        
        orientacao.innerHTML = $etapa[0].getAttribute('data-orientacao');
        orientacao.style.maxWidth = ((($tela.width() - $etapa.outerWidth())/2) - 30) + 'px';
        orientacao.style.top = (($etapa.position().top + ($etapa.outerHeight()/2)) - ($orientacao.outerHeight()/2)) + 'px';
        orientacao.style.left = ($etapa.position().left + $etapa.outerWidth() + 20) + 'px';
        
        $orientacao.removeClass('invisivel').addClass('seta-praesquerda');
    },
    entrar : function(container){
        var $container = $(container);
        var $capsula = Simulacao.obterCapsula($container);
        var $barraProgressoPai = $('.principal:eq(0)').children('.barraProgresso:eq(0)');
        var $telaPai = $container.parent();
        
        $barraProgressoPai.addClass('progresso-bloqueado');
        $telaPai[0].setAttribute('data-tempo-tela','1000');
        
        if(typeof($container[0].etapasEstaoPosicionadas) == "undefined"){
            Simulacao.definirEtapas($container);
            $container[0].etapasEstaoPosicionadas = true;
        }
        
        $container.children('.entrada').removeClass('entrada');
        
        Telas.aplicarEntradaEmTela($container);
        
        Simulacao.acionarEtapa($capsula);
    },
    /*montarMensagem : function(estaCorreto, campo){
        var $container = $('.container:eq(0)');
        var $boxMensagem = $(campo).parent().parent().children('.mensagem');
        var mensagem;
        if(estaCorreto){
            mensagem = $boxMensagem[0].getAttribute('data-retorno-1');
            mensagem = EncodeDecode.obterValorDecodificado(mensagem);
            $boxMensagem.addClass('mensagem-correta').children('.rolagem').html(mensagem);
        }else{
            mensagem = $boxMensagem[0].getAttribute('data-retorno-0');
            mensagem = EncodeDecode.obterValorDecodificado(mensagem);
            $boxMensagem.addClass('mensagem-incorreta').children('.rolagem').html(mensagem);
        }
        $boxMensagem.addClass('efeitos');
        if(Number($container[0].getAttribute('data-tela-atual')) != Telas.totalDeTelas-1){
            $container.children('.barraProgresso').removeClass('progresso-bloqueado');
        }
    },*/
    montarMensagemMultipla : function($boxMensagem, boxMensagemTipo, mensagens){
        var $container = $('.container:eq(0)');
        
        Telas.verificarPausa();
        
        $boxMensagem.addClass('efeitos mensagem-'+boxMensagemTipo).children('.rolagem:eq(0)').html(mensagens);
        
        if(Number($container[0].getAttribute('data-tela-atual')) != Telas.totalDeTelas-1){
            $container.children('.barraProgresso').removeClass('progresso-bloqueado');
        }
    },
    montarMiniMensagem : function($campo){
        var $tela = $campo.closest('.tela');
        var $miniMensagem = $tela.find('.mini-mensagem:eq(0)');
        var corDeFundo, mensagem;
        
        if($miniMensagem.html() == ""){
            corDeFundo = 'mensagem-incorreta';
            mensagem = 'Dados incorretos. Tente novamente.';
            $miniMensagem.html(mensagem).addClass(corDeFundo);
        }
        $miniMensagem.addClass('dentro').removeClass('fora');
        setTimeout(function(){
            $miniMensagem.addClass('fora').removeClass('dentro')
        },500);
    },
    obterCapsula : function($container){
        var numeroTela, $telas, $tela, $capsula;
        
        numeroTela = Number($container[0].getAttribute('data-tela-atual'));
        $telas = $container.children('.tela');
        $tela = $telas.eq(numeroTela);
        $capsula = $tela.children('.capsula:eq(0)');
        
        $capsula[0].setAttribute('data-etapa',0);
        
            $capsula[0].posicaoAlvo = {
                left: $tela.width()*.5, 
                top: $tela.height()*.5
            };
        
        return $capsula;
    },
    onAvancar : function(e){
        var $container = $(e.target).closest('.container');
        var $capsula = Simulacao.obterCapsula($container);
        Simulacao.tratarObjetosDaSimulacao($container);
        Simulacao.acionarEtapa($capsula);
    },
    /*onAvancarDblClick : function(e){
        e.stopPropagation();
        e.preventDefault();        
        var $container = $(e.target).closest('.container');
        var $capsula = Simulacao.obterCapsula($container);
        Simulacao.tratarObjetosDaSimulacao($container);
        Simulacao.acionarEtapa($capsula);
    },*/
    onRetroceder: function(e){
        var $container = $(e.target).closest('.container');
        var $capsula = Simulacao.obterCapsula($container);
        Simulacao.tratarObjetosDaSimulacao($container);
        Simulacao.acionarEtapa($capsula);
    },
    onRecarregar: function(e){
        var $container = $(e.target).closest('.container');
        var $capsula = Simulacao.obterCapsula($container);
        Simulacao.tratarObjetosDaSimulacao($container);
        Simulacao.acionarEtapa($capsula);
    },
    onPular: function(e){
        var $container = $(e.target).closest('.container');
        var $capsula = Simulacao.obterCapsula($container);
        Simulacao.tratarObjetosDaSimulacao($container);
        Simulacao.acionarEtapa($capsula);
    },
    sair : function(container){
        var $container = $(container);
        $container.find('.etapa-atual').removeClass('etapa-atual');
        $container.find('input').val("");
        $container.find('.capsula').each(function(i){
            this.setAttribute('data-etapa',0);
            $(this).children('.visivel').removeClass('visivel');
        });
        /*$container.find('.mascara:eq(0)').css('display','none');
        $container.find('.mensagem:eq(0)').removeClass('efeitos mensagem-incorreta mensagem-correta mensagem-parcial').children(':first').html('');
        $container.find('.mini-mensagem:eq(0)').addClass('fora').removeClass('dentro');*/
        container.setAttribute('data-tela-atual','0');
        container.setAttribute('data-tela-anterior','');
        $container.children('.controles:eq(0)').children('.desabilitado').removeClass('desabilitado');
        $container.children('.saida').removeClass('saida');
        $container.children('.entrada').removeClass('entrada');
        Telas.sairObjetosDaTela($container);
    },
    tratarObjetosDaSimulacao : function($container){
        var $telas = $container.children('.tela');
        var $tela = $telas.eq(Number($container[0].getAttribute('data-tela-atual')));
        var $mensagem = $tela.children('.mensagem');
        var $capsula = $tela.children('.capsula');

        
        $tela.children('.mascara:eq(0)').css('display','none');
        $tela.children('.mensagem:eq(0)').removeClass('efeitos mensagem-incorreta mensagem-correta mensagem-parcial').children(':first').html('');
        $tela.children('.mini-mensagem:eq(0)').addClass('fora').removeClass('dentro');
        
        $tela.find('input').val('');
        $capsula.children('.visivel').removeClass('visivel');

       /* if($mensagem.size() > 0) {
            $mensagem.eq(0).removeClass('efeitos mensagem-incorreta mensagem-correta mensagem-parcial').children().html('');
        }*/
        
    },
    
    validarEntradas : function(acionador){
        var $simulacao = $(acionador).closest('.simulacao');
        var $boxMensagem = $simulacao.find('.mensagem:eq(0)');
        var resposta = "";
        var mensagens = "Parabéns! Você completou a simulação";
        var resultado = 100;
        var boxMensagemTipo = "correta";
        
        if($simulacao[0].getAttribute('data-simulacao-tipo') == 'avaliativa'){
            var $inputs = $simulacao.find('input[type=text]');
            var acertos = 0;
            
            if($inputs.size() > 0){
                mensagens = "";
                $inputs.each(function(i){
                    var valores = EncodeDecode.obterValorDecodificado(this.getAttribute('data-entradas')).split('|');
                    var retorno = 0;
                    var mensagem;
                    
                    for (valor in valores){
                        resposta = (resposta == "")? this.value : resposta + ',' + this.value;
                        if(valores[valor].toLowerCase() == this.value.toLowerCase()){
                            acertos++;
                            retorno = 1;
                            break;
                        }
                    }
                    
                    mensagem = EncodeDecode.obterValorDecodificado(this.getAttribute('data-retorno-'+retorno));
                    mensagens +=  ('<p><span class="retorno-'+retorno+'"></span><strong>Campo '+(i+1)+':</strong> '+ mensagem + '</p>');
                });
                
                if(acertos > 0 && acertos < $inputs.size()){
                    boxMensagemTipo = "parcial";
                    resultado = 50;
                }
            }
        }
        
        $simulacao.find('.mascara').css('display','block');
        Simulacao.montarMensagemMultipla($boxMensagem, boxMensagemTipo, mensagens);
        
        if($simulacao.hasClass('interacao')){
            if(SCORMFunctions.scormIsLoaded()){
                var indice = $('.interacao').index($simulacao);
                SCORM.registrarInteracao('sm',indice,'performance',resposta,resultado);
            }else{
                $simulacao[0].nota = resultado;
                console.log('Não foi possível registrar a simulação. SCORM não corregado.');
            }
        }
    },
    validarInput : function(campo){
        var $input = $(campo);
        var $container = $input.closest('.container');
        var $capsula;
        
        if($container[0].getAttribute('data-simulacao-tipo') != 'avaliativa'){
            var valores = EncodeDecode.obterValorDecodificado(campo.getAttribute('data-entradas')).split('|');
            var estaCorreto = false;
            
            for (valor in valores){
                if(valores[valor].toLowerCase() == campo.value.toLowerCase()){
                    estaCorreto = true;
                    break;
                }
            }
            
            if(estaCorreto){
                definirProximasAcoes();
            }else{
                Simulacao.montarMiniMensagem($input);
            }
            
        }else{
            definirProximasAcoes();
        }
        
        function definirProximasAcoes(){
            if($input.hasClass('avancar')){
                Telas.avancarTela($container);
                setTimeout(function(){
                    $capsula = Simulacao.obterCapsula($container);
                    Simulacao.tratarObjetosDaSimulacao($container);
                    Simulacao.acionarEtapa($capsula);
                });
            }else{
                $capsula = $input.parent();
                Simulacao.acionarEtapa($capsula);
            }
        }
    },
};

var EncodeDecode = {
    obterValorCodificado : function(valor){
        var valorCodificado = valor.split('').map(
            function(caracter){
                return String.fromCharCode(255-(caracter.charCodeAt(0)-32));
            }
        );
        return valorCodificado.join('');
    },
    obterValorDecodificado : function(valor){
        var valorDecodificado = valor.split('').map(
            function(caracter){
                return String.fromCharCode(32+(255-caracter.charCodeAt(0)));
            }
        );
        return valorDecodificado.join('');
    },
};

var Animacao = {
    carregar : function(){
        Animacao.aplicarAcoesBotoes();
    },
    aplicarAcoesBotoes : function(){
        $('.animacao').each(function(i){
            var $container = $(this).closest('.container');
            var $btTocarPausar = $container.children('.controles').find('.bt-tocarpausar').eq(0);
            $btTocarPausar.on('click', Animacao.onTocarPausarAnimacao);
        });
        $(document).keydown(function(e){
            if(e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREAS'){
                if(e.keyCode == 80) {
                    var $container = $('.container:eq(0)');
                    var $telas = $container.children('.tela');
                    var numeroTela = Number($container[0].getAttribute('data-tela-atual'));
                    var $tela = $telas.eq(numeroTela);
                    Animacao.tocarPausarAnimacao($tela);
                }
            }
        });
    },
    acionarEtapaDeTransicao : function($elemento){
        var etapa, regra, posicao;

        posicao = $elemento[0].posicao;
        
        if(posicao <= $elemento[0].etapas.length-1){
            clearInterval($elemento[0].interv);
            $elemento[0].tempogasto = 0;
            $elemento[0].interv = setInterval(function(){
                if(!$elemento.hasClass('transicao-pausada')) $elemento[0].tempogasto += 100;
            },100);
            
            etapa = $elemento[0].etapas[posicao][1];
            
            for (regra in etapa){
                $elemento[0].style[regra] = etapa[regra];
            }

            $elemento[0].posicao = posicao + 1;
        }
    },
    clonarElementoAtual : function(){
    
        //Código obtido em http://jsfiddle.net/HP326/6/
        function css(a) {
            var sheets = document.styleSheets, o = [];
            a.matches = a.matches || a.webkitMatchesSelector || a.mozMatchesSelector || a.msMatchesSelector || a.oMatchesSelector;
            for (var i in sheets) {
                var rules = sheets[i].rules || sheets[i].cssRules;
                for (var r in rules) {
                    if (a.matches(rules[r].selectorText)) {
                        o.push(rules[r].cssText);
                        console.log(rules[r]);
                    }
                }
            }
            return o;
        }

        console.log(css(document.getElementById('vmf')));
    },
    dispararAcaoDeFimDeAtraso : function(e){
        var $elemento = $(e.target);
        $elemento.removeClass('atraso');
        setTimeout(function(){Animacao.acionarEtapaDeTransicao($elemento)});
    },
    dispararAcaoDeFimDeTransicao : function(e){
        clearInterval(e.target.interv);
        e.target.tempogasto = 0;
        e.target.style.transitionDuration = '.5s';
        
        if(!$(e.target).hasClass('atraso') && e.target.posicao <= e.target.etapas.length-1){ 
            e.target.style.animationDelay = e.target.etapas[e.target.posicao][0];
            $(e.target).addClass('atraso');
        }
    },
    entrar : function(elemento){
        var $elemento, etapas;
        
        $elemento = $(elemento);

        if(typeof(elemento.etapas) == "undefined") {
            elemento.etapas = JSON.parse(elemento.getAttribute('data-etapas'));
        }
        if(typeof(elemento.cssinicial) == "undefined"){
            elemento.cssinicial = elemento.style.cssText;
        }
        elemento.posicao = 0;
        elemento.interv = 0;
        elemento.tempogasto = 0;
        
        $elemento.removeClass('efeitos');
        
        elemento.addEventListener('webkitAnimationEnd', Animacao.dispararAcaoDeFimDeAtraso, false);
        elemento.addEventListener('animationend', Animacao.dispararAcaoDeFimDeAtraso, false);
        
        elemento.addEventListener("webkitTransitionEnd", Animacao.dispararAcaoDeFimDeTransicao, false);
        elemento.addEventListener("transitionend", Animacao.dispararAcaoDeFimDeTransicao, false);
        
        elemento.style.animationDelay = elemento.etapas[0][0];
        
        $elemento.addClass('atraso');
    },
    onTocarPausarAnimacao : function(e){
        var $container = $(e.target).closest('.container');
        var $telas = $container.children('.tela');
        var numeroTela = Number($container[0].getAttribute('data-tela-atual'));
        var $tela = $telas.eq(numeroTela);
        Animacao.tocarPausarAnimacao($tela);
    },
    pausarAnimacao : function($elemento){
        var etapa, regra, valor, posicao;
        
        if(!$elemento.hasClass('atraso')){
            posicao = $elemento[0].posicao;
            posPrev = (posicao > 0)? posicao-1 : 0;
        
            etapa = $elemento[0].etapas[posPrev][1];
            
            for (regra in etapa){
                valor = window.getComputedStyle($elemento[0],null).getPropertyValue(regra);
                $elemento[0].style[regra] = valor;
            }
            $elemento.addClass('transicao-pausada');
        }
    },
    sair : function(elemento){
        var $elemento = $(elemento);
        
        elemento.removeEventListener('webkitAnimationEnd', Animacao.dispararAcaoDeFimDeAtraso, false);
        elemento.removeEventListener('animationend', Animacao.dispararAcaoDeFimDeAtraso, false);
        
        elemento.removeEventListener("webkitTransitionEnd", Animacao.dispararAcaoDeFimDeTransicao, false);
        elemento.removeEventListener("transitionend", Animacao.dispararAcaoDeFimDeTransicao, false);
        
        elemento.style.cssText = $elemento[0].cssinicial;
        
        //$elemento.addClass('efeitos').removeClass('transicao-pausada').removeClass('atraso');
        $elemento.removeClass('transicao-pausada atraso').addClass('efeitos');
    },
    tocarAnimacao : function($elemento){
        var tempoRestante, posPrev, etapa, regra, posicao;
        
        if(!$elemento.hasClass('atraso')) {
            posicao = $elemento[0].posicao;
            posPrev = (posicao > 0)? posicao-1 : 0;
            
            tempoRestante = 500 - $elemento[0].tempogasto;
            tempoRestante = tempoRestante/1000;
            tempoRestante = ((tempoRestante <= 0)? 0.1 : tempoRestante) +'s';
            
            $elemento[0].style.transitionDuration = tempoRestante;
            
            $elemento.removeClass('transicao-pausada');
            
            etapa = $elemento[0].etapas[posPrev][1];
            
            for (regra in etapa){
                $elemento[0].style[regra] = etapa[regra];
            }
        }
    },
    tocarPausarAnimacao : function($tela){
        $tela.find('> .animacao, > div .animacao').each(function(){
            if(!$tela.hasClass('pausa')){
                Animacao.tocarAnimacao($(this));
            }else{
                Animacao.pausarAnimacao($(this));
            }
        });
    },
};

var AnimacaoPorEstilo = {
    carregar : function(){
        AnimacaoPorEstilo.aplicarAcoesBotoes();
    },
    aplicarAcoesBotoes : function(){
        $('.animacaoPorEstilo').each(function(i){
            this.addEventListener("animationend", AnimacaoPorEstilo.onFimDeAnimacao, false);
            this.addEventListener("webkitAnimationEnd", AnimacaoPorEstilo.onFimDeAnimacao, false);
        });
    },
    acionarEtapaDeTransicao : function(elemento){
        var $elemento, etapas, regra, posicao;
        
        $elemento = $(elemento);
        
        etapas = elemento.getAttribute('data-etapas').split(' ');

        posicao = Number(elemento.getAttribute('data-etapa'));
        
        if(posicao <= etapas.length-1){
            $elemento.addClass(etapas[posicao]);
            elemento.setAttribute('data-etapa', posicao+1);
        }
    },
    entrar : function(elemento){
        var classes = elemento.getAttribute('data-etapas');
        $(elemento).removeClass(classes);
        elemento.setAttribute('data-etapa', 0);
        AnimacaoPorEstilo.acionarEtapaDeTransicao(elemento);
    },
    onFimDeAnimacao : function(e){
        AnimacaoPorEstilo.acionarEtapaDeTransicao(e.target);
    },
    sair : function(elemento){
        var classes = elemento.getAttribute('data-etapas');
        $(elemento).removeClass(classes);
        elemento.setAttribute('data-etapa', 0);
    },
};
/*
var AnimacaoInLine = {
    entrar : function(elemento){
        elemento.style.animation = elemento.getAttribute('data-etapas');
    },
    sair : function(elemento){
        elemento.style.animation = 'none';
    },
};
*/
var Questao = {
    carregar : function(){
        Questao.aplicarAcoesBotoes();
    },
    aplicarAcoesBotoes : function(){
        //$('.bt-avancar-duploclique').on('dblclick', Questao.onAvancarDblClick);
        $('.bt-responder').on('click', Questao.validar);
        $('.questao input').on('click', Questao.tratarBotaoResponder);
        $(document).on('change', '.questao select', Questao.tratarBotaoResponder);
    },
    desabilitarBotoes : function(){
        $('.bt-responder').prop("disabled",true);
    },
    entrar : function(elemento){
        //var $container = $(elemento).closest('.container');
        Questao.tratarObjetosDaQuestao(elemento);
    },
    montarMensagem : function($questao, resultado){
        var $container = $questao.closest('.container');
        var $tela = $questao.closest('.tela');
        var $boxMensagem = $tela.find('.mensagem:eq(0)');
        var classeMsg;
        var mensagem;
        var urlDoAudio;
        
        Audios.pausarAudioDoEnunciado($tela);
        
        $questao.parent().children('.mascara').css('display','block');
        
        if(isNaN(resultado)){
            var multiretorno = resultado.split('|');
            
            if(isNaN(multiretorno[1])){
                classeMsg = 'mensagem-neutra';
            }else{
                classeMsg = (Number(multiretorno[1]) > 0) ? (Number(multiretorno[1]) < 100) ? 'mensagem-parcial' : 'mensagem-correta' : 'mensagem-incorreta';
            }
            mensagem = multiretorno[0];
            urlDoAudio = $questao.find('input').eq(multiretorno[2])[0].getAttribute('data-audio');
        }else{
            if(resultado <= 0){
                classeMsg = 'mensagem-incorreta';
                mensagem = $boxMensagem[0].getAttribute('data-retorno-0');
                mensagem = EncodeDecode.obterValorDecodificado(mensagem);
                urlDoAudio = $boxMensagem[0].getAttribute('data-audio-retorno-0');
            }else if( resultado >= 100){
                classeMsg = 'mensagem-correta';
                mensagem = $boxMensagem[0].getAttribute('data-retorno-1');
                mensagem = EncodeDecode.obterValorDecodificado(mensagem);
                urlDoAudio = $boxMensagem[0].getAttribute('data-audio-retorno-1');
            }else{
                classeMsg = 'mensagem-parcial';
                mensagem = $boxMensagem[0].getAttribute('data-retorno-parcial');
                mensagem = EncodeDecode.obterValorDecodificado(mensagem);
                urlDoAudio = $boxMensagem[0].getAttribute('data-audio-retorno-parcial');
            }
        }
        
        if(urlDoAudio) Audios.aplicarAudioDeRetorno($boxMensagem,EncodeDecode.obterValorDecodificado(urlDoAudio));
        
        Telas.verificarPausa($tela);
        
        $boxMensagem.addClass(classeMsg).children('.rolagem').html(mensagem);
        $boxMensagem.addClass('efeitos');
        
        if(Number($container[0].getAttribute('data-tela-atual')) != Telas.totalDeTelas-1){
            $container.children('.barraProgresso').removeClass('progresso-bloqueado');
        }
    },
    sair : function(elemento){
        var $audioMensagem = $(elemento).closest('.tela').children('.mensagem:eq(0)').children('audio:eq(0)');
        if($audioMensagem.size() > 0) $audioMensagem.remove();
    },
    tratarObjetosDaQuestao : function(elemento){
        var $questao, $tela, tipo;
        $questao = $(elemento);
        $tela = $questao.closest('.tela');
        tipo = $questao[0].getAttribute('data-questao-tipo');
        
        if($questao.size() > 0){
            switch(tipo){
                case "unica":
                case "multipla":
                case "multiretornos":
                    var $inputsTicados = $questao.find(':checked');
                    if($inputsTicados.size() > 0){
                        $inputsTicados.prop('checked',false);
                    }
                    break;
                case "verdadeirofalso":
                    var $selects = $questao.find('select');
                    if($selects.size() > 0){
                        $selects.each(function(i){
                            this.selectedIndex = 0;
                        });
                    }
                    break;
                case "correspondencia":
                    Correspondencia.montarAlternativas($questao,true);
                    break;
                case "ordenacao":
                    Correspondencia.montarAlternativas($questao,false);
                    break;
            }
            
            $tela.children('.mensagem:eq(0)').removeClass('efeitos mensagem-neutra mensagem-correta mensagem-incorreta mensagem-parcial').children('.rolagem:eq(0)').html("");
            $questao.find('.bt-responder:eq(0)')[0].disabled = true;
            $tela.children('.mascara:eq(0)').css('display','none');
        }
    },
    tratarBotaoResponder : function(e){
        var $questao = $(e.target).closest('.questao');
        var $btResponder = $questao.find('.bt-responder:eq(0)');
        var statusBotao;
        
        if(e.target.tagName == 'INPUT'){
            var $checkeds = $questao.find('input:checked');
            statusBotao = !$checkeds.size() > 0;
        }else if(e.target.tagName == 'SELECT'){
            statusBotao = false;
            var $selects = $questao.find('select');
            $selects.each(function(i){
                if($(this)[0].selectedIndex == 0){
                    statusBotao = true;
                    return false;
                }
            });
        }
        $btResponder[0].disabled = statusBotao;
    },
    validar : function(e){
        var $questao = $(e.target).closest('.questao');
        var tipoDeQuestao = $questao[0].getAttribute('data-questao-tipo');
        var $alternativa, sufixo, retornos, penalidades, tipoInteracao="", audio, resposta="", resultado = 0;
        
        switch(tipoDeQuestao){
            case 'unica':
            case 'multipla':
                retornos = EncodeDecode.obterValorDecodificado($questao[0].getAttribute('data-questao-retorno')).split('|');
                penalidades = EncodeDecode.obterValorDecodificado($questao[0].getAttribute('data-questao-penalidade')).split('|');
                $alternativa = $questao.find('input');
                $alternativa.each(function(i){
                    if($(this).is(':checked')){
                        resultado += (parseInt(retornos[i])-parseInt(penalidades[i]));
                        resposta = (resposta == "")? (i+1) : resposta+","+(i+1);
                    }
                });
                sufixo = (tipoDeQuestao == 'unica')? 'un' : 'mu';
                //tipoInteracao = "choice";
                break;
            case 'multiretornos' : 
                var retorno;
                var msgParam;
                var idxAlternativa;
                if($questao[0].getAttribute('data-questao-retorno')){
                    retornos = EncodeDecode.obterValorDecodificado($questao[0].getAttribute('data-questao-retorno')).split('|');
                }
                $alternativa = $questao.find('input');
                $alternativa.each(function(i){
                    if($(this).is(':checked')){
                        retorno = EncodeDecode.obterValorDecodificado(this.getAttribute('data-retorno'));
                        idxAlternativa = i;
                        if(typeof(retornos) != "undefined"){
                            resultado = parseInt(retornos[i]);
                            resposta = i+1;
                            msgParam = resultado;
                        }else{
                            resultado = 100;
                            resposta = 'preenchida';
                            msgParam = resposta;
                        }
                        return false;
                    }
                });
                sufixo = 'mr';
                //tipoInteracao = "choice";
                break;
            case 'verdadeirofalso':
            case 'correspondencia':
            case 'ordenacao':
                $alternativa = $questao.find('select');
                var valorDasAlternativas = Math.ceil(100/$alternativa.size());
                var valorOpcao,acerto;
                $alternativa.each(function(i){
                    valorOpcao = $(this).val();
                    if(tipoDeQuestao == 'verdadeirofalso'){
                        retornos = EncodeDecode.obterValorDecodificado($questao[0].getAttribute('data-questao-retorno')).split('|');
                        //tipoInteracao = "true-false";
                        sufixo = 'vf';
                    }else{
                        retornos = $questao[0].idxRandom;
                        //tipoInteracao = "matching";
                        sufixo = 'co';
                    }
                    acerto = (valorOpcao == retornos[i]) ? 1 : 0;
                    resultado += (valorDasAlternativas * acerto);
                    resposta = (resposta === "")? acerto : (resposta+","+acerto);
                });
                break;
        }
        
        tipoInteracao = "choice"; //bug LMS
        
        if (resultado < 0) resultado = 0;
        if (resultado > 100) resultado = 100;
        
        e.target.disabled = true;
        
        //$questao.parent().children('.mascara').css('display','block');
        Questao.montarMensagem($questao, (sufixo == 'mr') ? retorno+'|'+msgParam+'|'+idxAlternativa : resultado);
        
        if($questao.hasClass('interacao')){
            var indice = $('.interacao').index($questao);
            if(SCORMFunctions.scormIsLoaded()){
                SCORM.registrarInteracao(sufixo,indice,tipoInteracao,resposta,resultado);
            }else{
                $questao[0].nota = resultado;
                console.log('Não foi possível registrar a interação. SCORM não corregado.');
            }
        }
    },
};

var Correspondencia = {
    montarAlternativas : function($questao,comLista){
        var arrLista, arrOpcoes, optToken, labelToken, idxLista, idxRandom, selectItens = lista = opcoes = "";
        
        if(comLista) arrLista = EncodeDecode.obterValorDecodificado($questao[0].getAttribute('data-questao-lista')).split('|');
        arrOpcoes = EncodeDecode.obterValorDecodificado($questao[0].getAttribute('data-questao-opcoes')).split('|');
        optToken = '<option value="%indice">%valor</option>';
        labelToken = '<label><select><option value="">...</option>%opcoes</select><span>%nome</span></label>';
        idxLista = [];
        
        for(var x=0; x < arrOpcoes.length; x++){
            if(comLista) lista += ('<li>'+arrLista[x]+'</li>');
            selectItens += optToken.replace('%indice',x).replace('%valor',x+1);
            idxLista.push(x);
        }
        
        idxRandom = Utilidades.randomizar(idxLista);
        
        for(var y=0; y < idxRandom.length; y++){
            opcoes += labelToken.replace('%opcoes',selectItens).replace('%nome',arrOpcoes[idxRandom[y]]);
        }
        
        $questao[0].idxRandom = idxRandom;
        
        if(comLista) $questao.find('.itens-corresp-ref').html('').append($(lista));
        $questao.find('.itens-corresp-lig').html('').append($(opcoes));
    },
};

var Lacuna = {
    ponteiro : 0,
    palavras : "",
    carregar : function(){
        $('.lacuna cite button').on('click', Lacuna.abrirListaPalavras);
        $('.bt-concluir-lacuna').on('click', Lacuna.validar);
    },
    abrirListaPalavras : function(e){
        var $tela = $(e.target).closest('.tela');
        var $mascara = $tela.children('.mascara:eq(0)');
        var $boxLacuna = $tela.children('.boxLacuna:eq(0)');
        $mascara.addClass('dentro').removeClass('fora');
        $boxLacuna.show().addClass('dentro');
        Lacuna.ponteiro = $(e.target).parent().find('button').index($(e.target));
    },
    aplicaAcaoBotoes : function($boxLacuna){
        $boxLacuna.find('.bt-preencher-lacuna').on('click', Lacuna.preencher);
    },
    entrar : function(elemento){
        var $tela = $(elemento).closest('.tela');
        var $boxLacuna = $(Lacuna.montarMenuBox(elemento));
        var $miniMensagem = $tela.children('.mini-mensagem:eq(0)');
        
        $miniMensagem.removeClass('mensagem-incorreta mensagem-correta').children('span').remove();
        
        $tela.find('.bt-concluir-lacuna:eq(0)')[0].disabled = true;
        
        $tela.append($boxLacuna);
        $boxLacuna.css({
            'margin-top':(($boxLacuna.height()*.5)*-1)+'px',
            'margin-left':(($boxLacuna.width()*.5)*-1)+'px',
        });
        Lacuna.aplicaAcaoBotoes($boxLacuna);
    },
    limpar : function($lacuna){
        $lacuna.find('cite:eq(0)').find('button').html('').removeClass('preenchida lacuna-correta lacuna-incorreta');
        $lacuna.find('.bt-concluir-lacuna:eq(0)')[0].disabled = true;
    },
    montarMiniMensagem : function($lacuna, estaCorreto){
        var $container = $lacuna.closest('.container');
        var $tela = $lacuna.closest('.tela');
        var $miniMensagem = $tela.children('.mini-mensagem:eq(0)');
        var corDeFundo, mensagem;
        var listaDeAudios, urlDoAudio;
        
        Audios.pausarAudioDoEnunciado($tela);
        
        listaDeAudios = $lacuna[0].getAttribute('data-audios');
        if(listaDeAudios){
            listaDeAudios = EncodeDecode.obterValorDecodificado(listaDeAudios).split(',');
            urlDoAudio = listaDeAudios[(estaCorreto)? 0 : 1];
            Audios.aplicarAudioDeRetorno($miniMensagem,urlDoAudio);
        }
        
        $miniMensagem.removeClass('mensagem-incorreta mensagem-correta').children('span').remove();
        
        if(estaCorreto){
            corDeFundo = 'mensagem-correta';
            mensagem = 'Correto!';
            
            if(Number($container[0].getAttribute('data-tela-atual')) != Telas.totalDeTelas-1){
                $container.children('.barraProgresso').removeClass('progresso-bloqueado');
            }
        }else{
            corDeFundo = 'mensagem-incorreta';
            mensagem = 'Incorreto! Tente novamente.';
            setTimeout(function(){Lacuna.limpar($lacuna)},750);
        }
                
        $miniMensagem.append($('<span>'+mensagem+'</span>')).addClass(corDeFundo + ' dentro').removeClass('fora');
        
        setTimeout(function(){
            $miniMensagem.addClass('fora').removeClass('dentro');
        },1000);
    },
    montarMenuBox : function(elemento){
        var palavrasRandom,menu,itemMenuToken,itemMenu;
        //<header>Opções<button class="bt-ico bt-box-sair">-</button></header>
        menu = '<div class="boxLacuna efeitos-evento entrada-duracao-250 saida-duracao-250 entrada-transparencia saida-transparencia"><ul class="menu-lacuna">%item%</ul></div>';
        itemMenuToken = '<li><button class="bt-preencher-lacuna">%valor%</button></li>';
        
        if(Lacuna.palavras == "") {
            Lacuna.palavras = EncodeDecode.obterValorDecodificado(elemento.getAttribute('data-lacuna-valores'));
        }
        palavrasRandom = Utilidades.randomizar(Lacuna.palavras.split('|'));
        
        for(palavra in palavrasRandom){
            itemMenu = itemMenuToken.replace('%valor%',palavrasRandom[palavra]);
            menu = menu.replace('%item%',itemMenu+'%item%');
        }
        
        menu = menu.replace('%item%','');
        
        return menu;
    },
    preencher : function(e){
        var $tela, $botao, $botoes, valor, corDeFundo, $mascara, $boxLacuna;
        
        $botao = $(e.target).closest('button');
        $tela = $(e.target).closest('.tela');
        $botoes = $tela.find('cite:eq(0)').find('button');
        
        valor = $botao.html();
        corDeFundo = (valor == Lacuna.palavras.split('|')[Lacuna.ponteiro]) ? 'lacuna-correta' : 'lacuna-incorreta';
        $botoes.eq(Lacuna.ponteiro).removeClass('lacuna-correta lacuna-incorreta').addClass('preenchida '+corDeFundo).html(valor);
        
        $mascara = $tela.children('.mascara:eq(0)');
        $boxLacuna = $tela.children('.boxLacuna:eq(0)');
        $mascara.addClass('fora').removeClass('dentro');
        $boxLacuna.removeClass('dentro').hide();
        
        if($tela.find('.preenchida').size() == $botoes.size()){
            $tela.find('.bt-concluir-lacuna:eq(0)')[0].disabled = false;
        }
    },
    sair : function(elemento){
        var $tela = $(elemento).closest('.tela');
        var $lacuna = $(elemento);
        var $mascara = $tela.children('.mascara:eq(0)');
        var $boxLacuna = $tela.children('.boxLacuna:eq(0)');
        var $audioMiniMensagem = $tela.children('.mini-mensagem:eq(0)').children('audio:eq(0)');
        
        if($audioMiniMensagem.size() > 0) $audioMiniMensagem.remove();
        
        $mascara.addClass('fora').removeClass('dentro');
        $boxLacuna.remove();
        
        Lacuna.limpar($lacuna);
        Lacuna.ponteiro = 0;
        Lacuna.palavras = "";
    },
    validar : function(e){
        var $lacuna = $(e.target).closest('.lacuna');
        var $btLacunas = $lacuna.find('cite:eq(0)').children('button');
        var palavras = Lacuna.palavras.split('|');
        var estaCorreto = true;
        var tipoInteracao = "fill-in";
        var resultado = 100;
        var resposta = 'preenchida';
        
        for(var x=0; x < $btLacunas.size(); x++){
            if($btLacunas.eq(x)[0].innerHTML != palavras[x]){
                estaCorreto = false;
                break;
            }
        }
        
        Lacuna.montarMiniMensagem($lacuna, estaCorreto);
        
        if($lacuna.hasClass('interacao')){
            var indice = $('.interacao').index($lacuna);
            if(SCORMFunctions.scormIsLoaded()){
                SCORM.registrarInteracao('lc',indice,tipoInteracao,resposta,resultado);
            }else{
                $lacuna[0].nota = resultado;
                console.log('Não foi possível registrar a interação. SCORM não corregado.');
            }
        }
    },
};

var Diagnostico = {
    carregar : function(){
        $('.bt-diagnosticar').on('click', Diagnostico.validar);
        $('.diagnostico input').on('click', Diagnostico.tratarBotaoResponder);
    },
    entrar : function(elemento){
        var $btDiagnostico = $(elemento).find('.bt-diagnosticar:eq(0)');
        $btDiagnostico[0].disabled = true;
    },
    montarMensagem : function($container, $diagnostico, $tela){
        var $boxMensagem = $tela.find('.mensagem:eq(0)');
        var mensagem = EncodeDecode.obterValorDecodificado($diagnostico[0].getAttribute('data-retorno'));
        var urlDoAudio = $diagnostico[0].getAttribute('data-audio');
        
        Audios.pausarAudioDoEnunciado($tela);

        if(urlDoAudio) Audios.aplicarAudioDeRetorno($boxMensagem,EncodeDecode.obterValorDecodificado(urlDoAudio));
        
        $diagnostico.parent().children('.mascara').css('display','block');
        
        Telas.verificarPausa($tela);
        
        $boxMensagem.children('.rolagem').html(mensagem);
        $boxMensagem.addClass('efeitos mensagem-neutra');
        
        if(Number($container[0].getAttribute('data-tela-atual')) != Telas.totalDeTelas-1){
            $container.children('.barraProgresso').removeClass('progresso-bloqueado');
        }
    },
    sair : function(elemento){
        var $tela = $(elemento).closest('.tela');
        var $mensagem = $tela.children('.mensagem:eq(0)');
        var $mascara = $tela.children('.mascara:eq(0)');
        var $inputsTicados = $(elemento).find(':checked');
        var $audioMensagem = $mensagem.children('audio:eq(0)');
        
        if($audioMensagem.size() > 0) $audioMensagem.remove();
        
        if($inputsTicados.size() > 0){
            $inputsTicados.prop('checked',false);
        }
        
        $mensagem.removeClass('efeitos mensagem-neutra').children(':eq(0)').html("");
        $mascara.css('display','none');
    },
    tratarBotaoResponder : function(e){
        var $tabela = $(e.target).closest('table');
        var $linha = $tabela.find('tr');
        var $btDiagnostico = $tabela.closest('.diagnostico').find('.bt-diagnosticar:eq(0)');
        var statusBotao = false;
        $linha.each(function(i){
            var $inputChecked = $(this).find('input:checked');
            if($inputChecked.size() == 0){
                statusBotao = true;
                return false;
            }
        });
        $btDiagnostico[0].disabled = statusBotao;
    },
    validar : function(e){
        var $container = $(e.target).closest('.container');
        var $tela = $(e.target).closest('.tela');
        var $diagnostico = $(e.target).closest('.diagnostico');
        var tipoInteracao = "likert";
        var resultado = 100;
        var resposta = 'preenchida';
        
        Diagnostico.montarMensagem($container,$diagnostico, $tela);
        
        if($diagnostico.hasClass('interacao')){
            var indice = $('.interacao').index($diagnostico);
            if(SCORMFunctions.scormIsLoaded()){
                SCORM.registrarInteracao('dg',indice,tipoInteracao,resposta,resultado);
            }else{
                $diagnostico[0].nota = resultado;
                console.log('Não foi possível registrar a interação. SCORM não corregado.');
            }
        }
    },
};

var Dialogo = {
    carregar : function(){
        $(document).on('click', '.bt-dialogo', Dialogo.validar); 
        $('.dialogo .bt-abrefecha').on('click', Dialogo.expandirBox);
    },
    entrar : function(elemento){
        Dialogo.limparMiniMensagem(elemento);
        Dialogo.montarBotoes(elemento);
    },
    habilitarBotoes : function($tela){
        var $mascara = $tela.find('.mascara');
        if($mascara.size() > 0){
            $mascara.eq(0).css('display','none');//mascara interna do dialogo
        }
        
        var $audioEnunciado = $tela.children('.audioEnunciado');
        if($audioEnunciado.size() > 0){
            setTimeout(function(){
                Telas.verificarPausa($tela);
                $audioEnunciado.eq(0).addClass('efeitos')
            });
        }
    },
    expandirBox : function(e){
        var $dialogo = $(e.target).closest('.dialogo');
        var classe = $dialogo[0].getAttribute('data-classe-expansao');
        if($dialogo.hasClass(classe)){
            $dialogo.removeClass('expandido '+classe);
        }else{
            $dialogo.addClass('expandido '+classe);
        }
    },
    limparMiniMensagem : function(elemento){
        var $tela = $(elemento).closest('.tela');
        var $miniMensagem = $tela.find('.mini-mensagem:eq(0)');
        $miniMensagem.removeClass('mensagem-incorreta mensagem-correta').children('span').remove();
    },
    montarBotoes : function(elemento){
        var $dialogo = $(elemento).closest('.dialogo');
        var arrInicial = EncodeDecode.obterValorDecodificado($dialogo[0].getAttribute('data-lista-acoes')).split('|');
        var arrFinal = [];
        var indexAlvo = $dialogo[0].getAttribute('data-alvo');
        var alvo = arrInicial[indexAlvo];
        var botoes = "";
        var quebra;
        
        $dialogo.children('.botoes-dialogo').html('');
        
        arrFinal.push(alvo);
        arrInicial.splice(indexAlvo, 1);
        
        for(var x = 0; x < 3; x++){
            indexAlvo = Math.floor(Math.random()*(arrInicial.length-1));
            
            arrFinal.push(arrInicial[indexAlvo]);
            arrInicial.splice(indexAlvo, 1);
        }
        
        arrFinal = Utilidades.randomizar(arrFinal);
        
        elemento.idxAlvo = arrFinal.indexOf(alvo);
        
        
        for(var y = 0; y < arrFinal.length; y++){
            quebra = (y == 1) ? '<br class="so-mob"/>' : '';
            botoes += ('<button class="bt bt-dialogo sombra">'+arrFinal[y]+'</button>'+quebra);
        }
        
        $dialogo.children('.botoes-dialogo:eq(0)').append($(botoes));
        
    },
    montarMensagem : function($dialogo, $tela){
        var $container = $tela.closest('.container');
        var $boxMensagem = $tela.find('.mensagem:eq(0)');
        var mensagem = EncodeDecode.obterValorDecodificado($dialogo[0].getAttribute('data-retorno'));
        
        $dialogo.parent().children('.mascara').css('display','block');
        
        Telas.verificarPausa($tela);
        
        $boxMensagem.children('.rolagem').html(mensagem);
        $boxMensagem.addClass('efeitos mensagem-correta');
        
        /*if(Number($container[0].getAttribute('data-tela-atual')) != Telas.totalDeTelas-1){
            $container.children('.barraProgresso').removeClass('progresso-bloqueado');
        }*/
        var $btAvancar = $container.children('.controles:eq(0)').children('button:last-child');
        if(!$btAvancar.hasClass('desabilitado') && !$container.hasClass('simulacao')){
            $btAvancar.addClass('destacado');
        }
    },
    montarMiniMensagem : function($dialogo, estaCorreto){
        var $container = $dialogo.closest('.container');
        var $tela = $dialogo.closest('.tela');
        var $miniMensagem = $tela.find('.mini-mensagem:eq(0)');
        var corDeFundo, mensagem;
        var listaDeAudios, urlDoAudio;
        
        Audios.pausarAudioDoEnunciado($tela);
        
        listaDeAudios = $dialogo[0].getAttribute('data-audios');
        if(listaDeAudios){
            listaDeAudios = EncodeDecode.obterValorDecodificado(listaDeAudios).split(',');
            urlDoAudio = listaDeAudios[(estaCorreto)? 0 : 1];
            Audios.aplicarAudioDeRetorno($miniMensagem,urlDoAudio);
        }
                
        $miniMensagem.removeClass('mensagem-incorreta mensagem-correta').children('span').remove();
        
        if(estaCorreto){
            corDeFundo = 'mensagem-correta';
            mensagem = 'Correto!';
            
            if(Number($container[0].getAttribute('data-tela-atual')) != Telas.totalDeTelas-1){
                $container.children('.barraProgresso').removeClass('progresso-bloqueado');
            }
        }else{
            corDeFundo = 'mensagem-incorreta';
            mensagem = 'Incorreto! Tente novamente.';
        }
        
        $miniMensagem.append($('<span>'+mensagem+'</span>')).addClass(corDeFundo + ' dentro').removeClass('fora');
        
        setTimeout(function(){
            $miniMensagem.addClass('fora').removeClass('dentro');
        },1000);
    },
    sair : function(elemento){
        var $dialogo = $(elemento);
        var $botoes = $dialogo.find('button');
        var $tela = $dialogo.closest('.tela');
        //var $mensagem = $tela.find('.mensagem:eq(0)');
        var $audioEnunciado = $tela.children('.audioEnunciado');
        var $audioMiniMensagem = $tela.children('.mini-mensagem:eq(0)').children('audio:eq(0)');
        
        if($audioMiniMensagem.size() > 0) $audioMiniMensagem.remove();
        
        if($audioEnunciado.size() > 0){
            setTimeout(function(){$audioEnunciado.eq(0).removeClass('efeitos')});
        }
        
        $botoes.prop('disabled',false).removeClass('bt-correto bt-incorreto');
        
        //$mensagem.removeClass('efeitos mensagem-correta').children(':eq(0)').html("");
        
        $dialogo.children('.mascara:eq(0)').css('display','block');
        $tela.children('.mascara:eq(0)').css('display','none');
    },
    validar : function(e){
        var $dialogo = $(e.target).closest('.dialogo');
        var botaoIndice = $dialogo.find('.bt-dialogo').index($(e.target));
        var $botao = $(e.target);
        
        if($dialogo[0].idxAlvo == botaoIndice){
            var $container = $(e.target).closest('.container');
            var $tela = $(e.target).closest('.tela');
            var tipoInteracao = "performance";
            var resultado = 100;
            var resposta = 'preenchida';
            
            $botao.addClass('bt-correto');
            Dialogo.montarMiniMensagem($dialogo, true);
            //Dialogo.montarMensagem($dialogo, $tela);
            
            if($dialogo.hasClass('interacao')){
                var indice = $('.interacao').index($dialogo);
                if(SCORMFunctions.scormIsLoaded()){
                    SCORM.registrarInteracao('dl',indice,tipoInteracao,resposta,resultado);
                }else{
                    $dialogo[0].nota = resultado;
                    console.log('Não foi possível registrar a interação. SCORM não corregado.');
                }
            }
        }else{
            $botao.prop('disabled',true).addClass('bt-incorreto');
            Dialogo.montarMiniMensagem($dialogo, false);
        }
    },
};

var Ponteiros = {
    criar : function($container){
        var ponteiros = "";
		var totalDeTelas = $container.children('.tela').size();
        for(var x=0; x<totalDeTelas; x++){
            ponteiros += ('<button class="ponteiro bt-pular" data-pulo="'+x+'"></button>');
        }
        ponteiros = '<div class="ponteiros">'+ponteiros+'</div>';
        $container.append($(ponteiros));
    },
    marcarPonteiro : function($container){
        var $ponteiros, numeroTela;
            $ponteiros = $container.children('.ponteiros');
        //if($ponteiros.size() > 0){
            setTimeout(function(){
                numeroTela = $container[0].getAttribute('data-tela-atual');
                $ponteiros.eq(0).find('.ponteiro-marcado').removeClass('ponteiro-marcado');
                $ponteiros.eq(0).children().eq(numeroTela).addClass('ponteiro-marcado');
            });
        //}
    },
};

var ComboDeTelas = {
    criar : function(){
		var $combo = $('#comboTelas');
        var itens = "";
        for(var x=0; x<Telas.totalDeTelas; x++){
            itens += ('<option value="'+x+'">'+(x+1)+'</option>');
        }
        $combo.append($(itens));
        $('#totalDeTelas').html(Telas.totalDeTelas);
    },
    selecionarOpcao : function(numeroTela){
        $('#comboTelas')[0].selectedIndex = numeroTela;
    },
};

var Sumario = {
    criar : function($container){
        var $telas = $container.children('.tela');
        var item = '<li><button class="bt-pular" data-pulo="%p%">%i%<span></span></button></li>';
        var sumario = '<ul class="sumario"><li class="tt-sumario">Sumário%s%</li></ul>';
        var regex = /%.[^%]*%/g;
        
        $telas.each(function(i){
            var cssVisitada = (SCORM.suspendData.visitadas.indexOf('-'+i+'-') == -1) ? "" : " telaVisitada";
            var esteGrupo = this.getAttribute('data-grupo');
            var tokenGrupo, esteGrupoPai, tokenGrupoPai, esteItem, sumarioTemp;
            
            if(esteGrupo){
                esteGrupoPai = this.getAttribute('data-grupo-pai');
                tokenGrupo = '%'+esteGrupo+'%';

                tokenGrupoPai = (esteGrupoPai) ? '%'+esteGrupoPai+'%' : '%s%';
                esteItem = item.replace('%i%','Tela '+(i+1)).replace('%p%',i).replace('bt-pular', 'bt-pular'+cssVisitada);
                
                if(sumario.indexOf(tokenGrupo) != -1){
                    sumarioTemp = sumario.replace(tokenGrupo,esteItem+tokenGrupo);
                }else{
                    sumarioTemp = sumario.replace(tokenGrupoPai, '<li><button class="tt-grupo bt-grupo"><span class="ico-seta fechado">^</span>'+esteGrupo+'</button><ul>'+tokenGrupo+'</ul></li>' + tokenGrupoPai);
                    sumarioTemp = sumarioTemp.replace(tokenGrupo,esteItem+tokenGrupo);
                }
                sumario = sumarioTemp;
            }else{
                console.log('Tela '+ (i+1) + ' não contém data-grupo');
            }
            //sumario = sumarioTemp;
        });
        sumario = sumario.replace(regex,'');
        
        $container.append('<div id="sumario" class="rolagem">'+sumario+'</div>');
        Sumario.aplicarAcoesBotoes();
    },
    aplicarAcoesBotoes : function(){
        $('#sumario .bt-grupo').off('click').on('click', function(e){
            e.stopPropagation();
            e.preventDefault();
            $("+ ul", this).slideToggle(250,'swing');
            $(this).children().toggleClass("fechado");
        });
        $('#bt-sumario').off('click').on('click', function(e){
            e.stopPropagation();
            e.preventDefault();
            $('#sumario').toggleClass("visivel");
        });
    },
    marcarTelaVisitada : function(numeroTela){
        $('#sumario .bt-pular:eq('+numeroTela+')').addClass('telaVisitada');
        
        if(SCORM.suspendData.visitadas.indexOf('-'+numeroTela+'-') == -1){
            SCORM.suspendData.visitadas+= (numeroTela+'-');
            if(SCORMFunctions.scormIsLoaded()){
                SCORM.registrarTelaVisitada();
            }
        }
    },
};

var Glossario = {
    conteudo:'<div id="boxGlossario" class="box efeitos-evento entrada-duracao-500 saida-duracao-500 entrada-porbaixo-elastico saida-porbaixo-elastico"><header>Glossario<button class="bt-ico bt-box-sair">-</button></header><div class="letras">%%letras%%</div>%%termos%%</div>',
    termos:{},
    criar : function(){
        var conteudo = Glossario.conteudo;
        var letraSpan = '<button id="letra_%%letra%%" class="letra">%%letra%%</button>';
        var termosBox = '<div id="termos_%%letra%%" class="box-content"><dl>%%termo%%</dl></div>';
        var termoList = '<dt>%%titulo%%</dt><dd>%%descricao%%</dd>';
        var termoListTemp;
        var letraTemp;
        var termoTemp;
        var termosBoxTemp;
        var todasLetras = '';
        var todosTermosBox = '';
        
        for(letra in Glossario.termos){
            letraTemp = letraSpan.replace(/%%letra%%/g, letra);
            todasLetras += letraTemp;
            termosBoxTemp = termosBox.replace('%%letra%%',letra);
            for(termo in Glossario.termos[letra]){
                termoTemp = Glossario.termos[letra][termo];
                termoListTemp = termoList.replace('%%titulo%%',termoTemp.titulo).replace('%%descricao%%',termoTemp.descricao);
                termosBoxTemp = termosBoxTemp.replace('%%termo%%',termoListTemp+'%%termo%%');
            }
            termosBoxTemp = termosBoxTemp.replace('%%termo%%','');
            todosTermosBox += termosBoxTemp;
        }
        conteudo = conteudo.replace('%%letras%%',todasLetras).replace('%%termos%%',todosTermosBox);
        
        $('.principal:eq(0)').after($(conteudo));
        
        $('#boxGlossario .letra:eq(0)').addClass('letraAtiva');
        $('#boxGlossario .box-content:eq(0)').addClass('boxAtivo');
        Glossario.aplicarAcoesBotoes();
        
    },
    aplicarAcoesBotoes : function(){
        $('#bt-glossario').click(function(e){
            Telas.ocultarBoxes();
            $('#boxGlossario').addClass('dentro').removeClass('fora');
        });
        $('.letra').click(function(e){
            var letra = $(this).attr('id').split('_')[1];
            $('.boxAtivo').removeClass('boxAtivo');
            $('.letraAtiva').removeClass('letraAtiva');
            $('#termos_'+letra).addClass('boxAtivo');
            $(this).addClass('letraAtiva');
        });
    },
};

var Tutorial = {
    url:'',
    largura:400,
    conteudo:'<div id="boxTutorial" class="box box-video-plyr efeitos-evento entrada-duracao-500 saida-duracao-500 entrada-porbaixo-elastico saida-porbaixo-elastico"><header>Tutorial<button class="bt-ico bt-box-sair">-</button></header><div class="box-content"><video class="plyr-ctn"><source src="%%url%%" type="video/mp4">Seu navegador não suporta vídeo HTML5.</video></div></div>',
    criar : function(){
        var conteudo = Tutorial.conteudo;
            conteudo = conteudo.replace('%%largura%%',Tutorial.largura);
            conteudo = conteudo.replace('%%url%%',Tutorial.url);
        
        $('.principal:eq(0)').after($(conteudo));
        Tutorial.aplicarAcoesBotoes();
    },
    aplicarAcoesBotoes : function(){
        $('#bt-tutorial').on('click',Tutorial.acaoTutorial);
    },
    acaoTutorial : function(e){
        Telas.ocultarBoxes();
        $('#boxTutorial').addClass('dentro').removeClass('fora');
    },
};

//===================== PONTUACAO =========================

var Relatorio = {
    somaDosResultados : 0,
};

var SCORM = {
    suspendData : {'visitadas':'-','interacoes':[]},
    /*metodos*/
    carregar : function(){
        if(SCORMFunctions.status !== false && window.self != window.top){
            var interv, contador = 0;
            $('body').append('<div id="carregandoSCORM"><span></span></div>');
            
            interv = setInterval(function(){
                if(contador >= 7000){
                    clearInterval(interv);
                    SCORMFunctions.status = false;
                    $('#carregandoSCORM').remove();
                    alert('Não foi possível carregar os recursos de pontuação do ambiente. Tente novamente mais tarde.');
                }else{
                    var status;
                    if(SCORMFunctions.scormIsLoaded()){
                        clearInterval(interv);
                        status = doLMSGetValue("cmi.core.lesson_status");
                        
                        console.log("lesson_status ao carregar o scorm:" + status);

                        if (status == "not attempted"){
                            // the student is now attempting the lesson
                            doLMSSetValue("cmi.core.lesson_status","incomplete");
                            doLMSSetValue("cmi.core.lesson_location","0");//cf runtimeenv (3-22)
                        }
                        
                        SCORMFunctions.status = true;//usado para verificar o unload
                        SCORMFunctions.startTimer();
                        SCORM.carregarSuspendData();
                        
                        $('#carregandoSCORM').remove();
                        Carregador.carregar();
                        
                    }else if(SCORMFunctions.status === false){//virou false mas ainda não deu os 7sec: reseta
                        SCORMFunctions.status = null;
                        SCORMFunctions.status = doLMSInitialize();
                    }
                }
                contador += 500;
            },500);
        }else{
            Carregador.carregar();
        }
    },
    carregarSuspendData : function(){
        var dadosTemporarios;
        
        if(doLMSGetValue('cmi.core.entry') != 'ab-initio'){
            dadosTemporarios = doLMSGetValue("cmi.suspend_data");
            if(dadosTemporarios != ""){
                SCORM.suspendData = JSON.parse(dadosTemporarios);
            }else{
                console.error('SuspendData não foi previamente armazenado.');
            }
        }else{
            for(var x=0; x < $('.interacao').size(); x++){
                SCORM.suspendData.interacoes[x] = {};
                doLMSSetValue("cmi.interactions." + x + ".weighting", "0");
            }
            doLMSSetValue("cmi.suspend_data",JSON.stringify(SCORM.suspendData));
            console.log('SuspendData inicial registrado.')
        }
    },
	aplicarNomeDoUsuario : function(){
		var nome = doLMSGetValue('cmi.core.student_name');
		if(nome.indexOf(',') != -1){
			nome = nome.split(',');
			nome = nome[1] +' '+ nome[0];
		}
		$('#nome-aluno').html(nome);
	},
    obterUltimaTelaVista : function(){
        var ponteiro = doLMSGetValue('cmi.core.lesson_location');
        return (ponteiro != "") ? ponteiro : "0";
    },
    registrarNumeroDaTela : function(numeroTela){
        doLMSSetValue('cmi.core.lesson_location',numeroTela+"");
        /*if(doLMSGetValue("cmi.core.exit") != "suspend"){
            doLMSSetValue("cmi.core.exit","suspend");
        }*/
        //doLMSCommit();
    },
    registrarInteracao : function(sufixo,indice,tipoInteracao,resposta,resultado){
        if(doLMSGetValue("cmi.core.lesson_status") == "incomplete"){
            var id = $('.principal:eq(0)')[0].getAttribute('data-codigo') + '_' + (indice + 1) + '_' + sufixo;
            
            if(SCORM.suspendData.interacoes[indice]){
                var tentativas = SCORM.suspendData.interacoes[indice].tent;

                SCORM.suspendData.interacoes[indice].id = id;
                SCORM.suspendData.interacoes[indice].tent = (tentativas) ? tentativas + 1 : 1;
                SCORM.suspendData.interacoes[indice].nota = resultado;
            }else{
                console.error('Interações não foram armazenadas previamente');
            }
            
            doLMSSetValue("cmi.interactions." + indice + ".student_response", resposta+"");//resposta
            doLMSSetValue("cmi.interactions." + indice + ".result", resultado+"");
            doLMSSetValue("cmi.interactions." + indice + ".id", id);
            doLMSSetValue("cmi.interactions." + indice + ".type", "performance");//tipoInteracao
            
            console.log('indice:'+indice);
            console.log('tipoInteracao:'+tipoInteracao);
            console.log('resposta:'+resposta);
            console.log('resultado:'+resultado);
            console.log(SCORM.suspendData);
            
            doLMSSetValue("cmi.suspend_data",JSON.stringify(SCORM.suspendData));
            
            //doLMSCommit();
            console.log('registrou SuspendData e interação');
            
            SCORM.registrarStatusDeLicaoESaida();
        }else{
            //doLMSSetValue("cmi.core.exit","");
            console.log('Não foi possível registrar a interação. Status da lição: '+doLMSGetValue("cmi.core.lesson_status"));
        }
    },
    registrarStatusDeLicaoESaida : function(){
        if(doLMSGetValue("cmi.core.lesson_status") == "incomplete"){
            var moduloCompletado = true;
            var grupo, i, pontuacao;
            
            Relatorio.somaDosResultados = 0;
            
            for(var x = 0; x < SCORM.suspendData.interacoes.length; x++){
                if(typeof(SCORM.suspendData.interacoes[x].nota) == "undefined"){
                    moduloCompletado = false;
                }else{
                    Relatorio.somaDosResultados += SCORM.suspendData.interacoes[x].nota;
                }
            }
            
            pontuacao = (Relatorio.somaDosResultados != 0) ? Relatorio.somaDosResultados/SCORM.suspendData.interacoes.length : 0.01;
            
            if(moduloCompletado){
                /*var valorMinimo = Math.ceil(SCORM.suspendData.interacoes.length * .5) * 100;
                var resultado = (Relatorio.somaDosResultados >= valorMinimo)? "passed" : "failed";
                doLMSSetValue("cmi.core.lesson_status", resultado);
                doLMSSetValue("cmi.core.score.raw",Math.ceil(100/totalDeSCOs));*/
                doLMSSetValue("cmi.core.lesson_status", "passed");
                doLMSSetValue("cmi.core.exit","");
                console.log('Aluno completou o módulo. Pontuação finalizada.');
            }else{
                /*var valorParcial = Math.ceil((Relatorio.somaDosResultados/SCORM.suspendData.interacoes.length)/totalDeSCOs);
                doLMSSetValue("cmi.core.score.raw",valorParcial);*/
                console.log('Aluno ainda não completou o módulo. Pontuação parcial registrada.');
                //console.log('Relatorio.somaDosResultados:'+Relatorio.somaDosResultados);
                //console.log('Raw:'+valorParcial);
                doLMSSetValue("cmi.core.exit","suspend");
            }
            doLMSSetValue("cmi.core.score.raw",pontuacao+"");
            doLMSCommit();
            console.log('score.raw computado: ' + pontuacao);
            console.log('registrouLicaoESaida');
        }else{
            //doLMSSetValue("cmi.core.exit","");
            console.log('Aluno já completou o módulo. Pontuação não alterada.');
        }
    },
    registrarTelaVisitada : function(){
        doLMSSetValue("cmi.suspend_data",JSON.stringify(SCORM.suspendData));
        //doLMSCommit();
    },
    registrarModulo : function(){
        if(doLMSGetValue("cmi.core.lesson_status") == "incomplete"){
            doLMSSetValue("cmi.core.lesson_status", "passed");
            //doLMSSetValue("cmi.core.score.raw",Math.ceil(100/totalDeSCOs));
            doLMSSetValue("cmi.core.score.raw","100");
            doLMSSetValue("cmi.core.exit","");
            doLMSCommit();
            console.log('Módulo completado'); 
        }
    },
};

var Pagina = {
    carregar : function(){
        Audios.carregar();
        Telas.carregar();
        Subtela.carregar();
        Simulacao.carregar();
        Animacao.carregar();
        AnimacaoPorEstilo.carregar();
        Questao.carregar();
        Lacuna.carregar();
        Diagnostico.carregar();
        Dialogo.carregar();
        NavegacaoExterna.carregar();
    }
};

var Audios = {
    carregar : function(){
        Audios.encontrarAudiosDasTelas();
    },
    aplicarAudioDeRetorno : function($boxMensagem,urlDoAudio){
        var $audio;
        var $audioAtual = $boxMensagem.children('audio');
        
        if($audioAtual.size() > 0){ 
            $audioAtual.remove();
        }
        
        $boxMensagem.append($('<audio><source src="audios/' + urlDoAudio + '.mp3" type="audio/mpeg"></audio>'));
        $audio = $boxMensagem.children('audio:eq(0)');
        $audio.addClass('carregado');//para o caso do oncanplay somar este áudio
        $audio[0].load();
        Audios.aplicarEventosDeAudio($audio[0]);
    },
    aplicarEventosDeAudio : function(audio){
        audio.parentNode.addEventListener("webkitAnimationEnd", Telas.dispararInicioDeAudio, false);
        audio.parentNode.addEventListener("animationend", Telas.dispararInicioDeAudio, false);
    
        audio.onplaying = function(e) {
            e.target.setAttribute('data-status','tocando');
        }
        audio.onended = function(e) {
            e.target.setAttribute('data-status','');
        };
    },
    encontrarAudiosDasTelas : function(){
        var $audios = $('.principal:eq(0)').find('audio');
        
        $audios.each(function(i){
            this.load();
            this.oncanplay = function(e){
                var $audio = $(e.target);
                if(!$audio.hasClass('carregado')){
                    var $tela = $(e.target).closest('article.tela');
                    $audio.addClass('carregado');
                    if($tela.children(':not(.container)').find('audio').size() == $tela.children(':not(.container)').find('.carregado').size()){
                        $tela.addClass('com-audio');
                    } 
                }
            };
            Audios.aplicarEventosDeAudio(this);
        });
    },
    montarMiniMensagem : function($tela){
        var corDeFundo, mensagem;
        var $miniMensagem = $('<div class="mini-mensagem efeitos-evento fora entrada-atraso-250 entrada-porcima saida-porcima entrada-duracao-500 saida-duracao-500 saida-atraso-750"></div>');
        
        $tela.append($miniMensagem);
        
        corDeFundo = 'mensagem-incorreta';
        mensagem = 'Áudios desta tela ainda não foram carregados';
        
        $miniMensagem.html(mensagem).addClass(corDeFundo + ' dentro').removeClass('fora');
        setTimeout(function(){
            $miniMensagem.addClass('fora').removeClass('dentro');
        },1500);
    },
    pausarAudioDoEnunciado : function($tela){
        var $audioEnunciado = $tela.children('.audioEnunciado');
        var $audio;
        if($audioEnunciado.size() > 0){
            $audio = $audioEnunciado.eq(0).children('audio:eq(0)');
            Telas.sairAudio($audio);
        }
    },
};

var ResultadoQuiz = {
    questoesComputadas : 0,
    questoesCorretas : 0,
    resultado : 0,
    tituloResultado : "",
    entrar : function(elemento){
        ResultadoQuiz.questoesCorretas = 0;
        ResultadoQuiz.resultado = 0;
        ResultadoQuiz.questoesComputadas = 0;
        ResultadoQuiz.definirPontuacao();
        ResultadoQuiz.definirRetorno(elemento);
    },
    definirPontuacao : function(){
        var interacoes;
        if(SCORMFunctions.scormIsLoaded()){
            interacoes = SCORM.suspendData.interacoes;
            for(interacao in interacoes){
                computarInteracao(interacoes[interacao].nota);
            }
        }else{
            interacoes = $('.interacao');
            interacoes.each(function(i){
                computarInteracao(this.nota);
            });
        }
        
        function computarInteracao(nota){
            if(typeof(nota) != "undefined"){
                ResultadoQuiz.resultado += nota;
                ResultadoQuiz.questoesComputadas++;
                if(nota == 100) ResultadoQuiz.questoesCorretas++;
            }else{
                if(ResultadoQuiz.tituloResultado == ""){
                    ResultadoQuiz.tituloResultado = 'parcial';
                }
            }
        }
    },
    definirRetorno : function(elemento){
        var totalDeQuestoes = $('.interacao').size();
        var quizRetornos = JSON.parse(elemento.getAttribute('data-quiz-retornos'));
        var $titulo = $(elemento).find('.titulo-quiz:eq(0)');
        var fraseTitulo = 'Resultado %ttResult% das questões:';
        var $blocoRetorno = $(elemento).find('.retorno-quiz:eq(0)');
        //var fraseRetorno = '<p>Você respondeu %soma% de %total% questões, atingindo %percent%% da nota do Quiz.</p>';
        var fraseRetorno = '<p>Total de questões: <span>%total%</span>.<br>Questões respondidas: <span>%soma%</span>.<br>Acertos: <span> %acertos%</span>*.<br>Nota: <span>%percent%%</span>.</p>';
        var fraseObs = '<p class="obs">(*) São consideradas corretas somente as respostas que atingiram 100% do valor da questões.</p>'
        var porcentagemDeAcerto = (ResultadoQuiz.questoesCorretas/totalDeQuestoes)*100;
        //(ResultadoQuiz.resultado/(totalDeQuestoes*100))*100;
        
        if(ResultadoQuiz.questoesComputadas != ""){
            var range;
            var idxRetornos;
            
            loop1:
            for(retorno in quizRetornos){
                range = quizRetornos[retorno][0].split('-');
                for(valor in range){
                    if(porcentagemDeAcerto <= range[valor]){
                        idxRetornos = retorno;
                        achou = true;
                        break loop1;
                    }
                }
            }
            fraseRetorno = fraseRetorno.replace('%soma%',ResultadoQuiz.questoesComputadas);
            fraseRetorno = fraseRetorno.replace('%acertos%',ResultadoQuiz.questoesCorretas);
            fraseRetorno = fraseRetorno.replace('%total%',totalDeQuestoes);
            fraseRetorno = fraseRetorno.replace('%percent%',Math.round(porcentagemDeAcerto));
            
            $blocoRetorno.addClass('efeitos').html(fraseRetorno + fraseObs + '<p>'+ quizRetornos[idxRetornos][1]+'</p>');
            
            if(ResultadoQuiz.tituloResultado == "") ResultadoQuiz.tituloResultado = 'total';
            fraseTitulo = fraseTitulo.replace('%ttResult%',ResultadoQuiz.tituloResultado);
            $titulo.addClass('efeitos').html(fraseTitulo);
        }else{
            fraseTitulo = fraseTitulo.replace('%ttResult%','');
            $titulo.addClass('efeitos').html(fraseTitulo);
            $blocoRetorno.addClass('efeitos').html('Nenhuma questão foi respondida até o momento.');
        }
    },
    sair:function(elemento){
        ResultadoQuiz.questoesComputadas = 0;
        ResultadoQuiz.resultado = 0;
        ResultadoQuiz.tituloResultado = "";
    }
};

var Carregador = {
    carregar : function(){
        Carregador.aplicarAcaoBotao();
    },
    aplicarAcaoBotao : function(){
        $('#mascara-iniciar button').show().on('click',function(){
            var audio = document.getElementById('audioblank');
            audio.load();
            audio.loop = true;
            audio.play();
            audio.pause();

            Pagina.carregar();
            
            $('#mascara-iniciar').remove();
        });
    },
};

var Utilidades = {
    executarCallback : function(fCallback){
        fCallback = fCallback.split("|");

        if(fCallback.length > 1){
            var objeto, metodo, parametro, fCallback2;
            
            objeto = window[fCallback[0]];
            fCallback2 = fCallback[1].split(":");
            metodo = fCallback2[0];
            
            if(fCallback2.length > 1) parametro = fCallback2[1];
            if(objeto) return objeto[metodo](parametro);
        }else{
            var funcao, parametro, fCallback2;
            
            fCallback2 = fCallback[0].split(":");
            funcao = fCallback2[0];
            
            if(fCallback2.length > 1) parametro = fCallback2[1];
            if(window[funcao]) return window[funcao](parametro);
        }
    },
    randomizar : function(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    },
};

var AutoRolagem = {
    entrar:function(elemento){
        var $alvo = $(elemento).find(elemento.getAttribute('data-alvo')).eq(0);
        var velocidade = parseInt(elemento.getAttribute('data-velocidade'));
        
        $alvo.stop().off().scrollTop(0);
        
        $alvo.animate({ scrollTop: $alvo[0].scrollHeight}, velocidade, "linear");
        
        $alvo.hover(
            function(){
                $(this).stop();
            },
            function(){
                $(this).animate({ scrollTop: $(this)[0].scrollHeight}, velocidade, "linear");
            }
        );
    },
    sair:function(elemento){},
};