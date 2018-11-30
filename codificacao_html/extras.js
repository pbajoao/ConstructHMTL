var Galeria = {
    criarMiniatura : function(elemento){
        var miniaturas = elemento.innerHTML.replace(/<div(.[^>]*)>/g,'<div>');
        $(elemento).after('<div class="miniatura efeitos entrada-transparencia entrada-duracao-500 entrada-atraso-500">'+miniaturas+'</div>');
        /*
        if miniatura retratil
        - cria botão retratil
        - aplicar classe retratil
        */
    },
    entrar : function(elemento){
        var miniatura = $(elemento).parent().find('.miniatura').size() > 0 ? true : false;
        if(!miniatura && elemento.getAttribute('data-miniatura')){
            Galeria.criarMiniatura(elemento);
        }
        
        if(!$(elemento).hasClass('slick-slider')) {
            Galeria.instanciarGaleria(elemento);
        }else{
            $(elemento).slick('slickGoTo',0);
            var slide_0 = elemento.getElementsByClassName('slick-slide')[0];
            if(slide_0.className.indexOf('bt-popup') != -1) Popup.abrir($(slide_0));
        }
        
        if(!miniatura && elemento.getAttribute('data-miniatura')) {
            Galeria.instanciarMiniatura(elemento);
        }
    },
    instanciarGaleria : function(elemento){
        var telaNum, intervalo, destaque, setas, pontos, responsividade, atributos, comMiniatura, miniatura = null;

        telaNum = $('.container:eq(0)')[0].getAttribute("data-tela-atual");
        intervalo = Number(elemento.getAttribute("data-intervalo")) || 1;
        destaque = Boolean(Number(elemento.getAttribute("data-destaque")) || 0);
        setas = Boolean(Number(elemento.getAttribute("data-setas")) || 0);
        pontos = Boolean(Number(elemento.getAttribute("data-pontos")) || 0);
        
        responsividade = [
            {
                breakpoint: 768, 
                settings: {
                    dots:pontos,
                    centerMode : false,
                    slidesToShow: (intervalo > 1) ? 2 : 1,
                    slidesToScroll: (intervalo > 1) ? 2 : 1
                }
            },
            {
                breakpoint: 992,
                settings: {
                    dots:pontos,
                    centerMode : destaque,
                    slidesToShow: intervalo,
                    slidesToScroll: intervalo,
                }
            },
        ];
        
        if(elemento.getAttribute("data-miniatura")){
            miniatura = ".container:eq(0) .tela:eq("+telaNum+") .miniatura:eq(0)";
            comMiniatura = elemento.getAttribute("data-miniatura") == "vertical" ? "com-miniatura-vertical" : "com-miniatura-horizontal";
            $(elemento).addClass(comMiniatura);
        }
        
        if(setas) $(elemento).addClass('com-setas');
        if(intervalo > 1) $(elemento).addClass('com-intervalo');
        if(elemento.getAttribute("data-cabecalho")) $(elemento).addClass('com-cabecalho');
        if(elemento.getAttribute("data-rodape")) $(elemento).addClass('com-rodape');
        
        /*miniatura = (elemento.getAttribute("data-miniatura")) ? ".container:eq(0) .tela:eq("+telaNum+") .miniatura:eq(0)" : null;*/
        
        atributos = {
            draggable : false,
            swipe:false,
            centerMode : false,
            centerPadding : '0',
            slidesToShow : 1,
            slidesToScroll : 1,
            arrows : setas,
            dots : pontos,
            fade : (intervalo == 1),
            asNavFor : miniatura,
            mobileFirst : true,
            focusOnSelect : false,
            responsive : responsividade
        }
        
        $(elemento).on({
            'init': function(slick){
                var slide_0 = slick.target.getElementsByClassName('slick-slide')[0];
                if(slide_0.className.indexOf('bt-popup') != -1) Popup.abrir($(slide_0));
                Zoom.instanciarZoom(elemento);
            },
            'beforeChange': function(slick, currentSlide, nextSlide){
                var popupID = slick.target.getElementsByClassName('slick-slide')[currentSlide.currentSlide].popupID;
                if(popupID) Popup.fechar($('#'+popupID));
            },
            'afterChange': function(slick, currentSlide){
                var slideAtual = slick.target.getElementsByClassName('slick-slide')[currentSlide.currentSlide];
                if(slideAtual.className.indexOf('bt-popup') != -1) Popup.abrir($(slideAtual));
            },
            'breakpoint' : function(event, slick, breakpoint){
                var slideAtual = event.target.getElementsByClassName('slick-current')[0];
                if(slideAtual.popupID && $('#'+slideAtual.popupID).hasClass('dentro')) Popup.posicionar(slideAtual);
            }
        }).slick(atributos);
    },
    instanciarMiniatura : function(elemento){
        var $miniaturas, telaNum, posicao, atributos;
        
        $miniaturas = $(elemento).parent().children('.miniatura:eq(0)');
        telaNum = $('.container:eq(0)')[0].getAttribute('data-tela-atual');
        posicao = (elemento.getAttribute('data-miniatura') == 'vertical') ? true : false;
        
        atributos = {
            centerMode : true,
            centerPadding : '0',
            slidesToShow : 5,
            slidesToScroll : 5,
            dots : false,
            asNavFor : ".container:eq(0) .tela:eq("+telaNum+") .galeria:eq(0)",
            mobileFirst : true,
            focusOnSelect : true,
            vertical : posicao
        }
        
        $miniaturas.slick(atributos);
    },
    sair : function(elemento){
        Popup.fecharPopupsAbertos();
    },
};

var Zoom = {
    instanciarZoom : function(elemento){
        $('.zoom', $(elemento)).zoom({
            on:'grab',
            onZoomIn:function(){
                var popupID = $(this).parent().parent()[0].popupID;
                if(popupID) document.getElementById(popupID).style.zIndex = "-1";
            },
            onZoomOut:function(){
                var popupID = $(this).parent().parent()[0].popupID;
                if(popupID) document.getElementById(popupID).style.zIndex = 10000 + Popup.zIndex;
            },
        });
    }
};

var Popup = {
    arrastando:null,
    zIndex : 0,
    arrastandoPos:{x:null,y:null},
    carregar : function(){
      if(document.querySelectorAll('.bt-popup').length > 0){
        $(document)
        .on('click', '.bt-popup', Popup.onAbrir)
        .on('click', '.bt-popup-fechar', Popup.onFechar)
        .on('mousedown', Popup.iniciarArrasto)
        .on('mouseup', Popup.pararArrasto);
        
        $('.bt-tocarpausar').on('click', Popup.tocarPausarAudio);
        $('.bt-avancar').on('click', Popup.onFecharTodos);
        $('.bt-retroceder').on('click', Popup.onFecharTodos);
        $('.bt-recarregar').on('click', Popup.onFecharTodos);
        
        $('.combo-pular').on('change', Popup.onFecharTodos);

        $(document).on('click', '.bt-pular', Popup.onFecharTodos); 

        $(document).keydown(function(e){
            if(e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREAS'){
                var $container = $('.container:eq(0)');
                switch (e.keyCode) {
                    case 35:
                        e.preventDefault();
                        Popup.fecharPopupsAbertos();
                        break;
                    case 36:
                        e.preventDefault();
                        Popup.fecharPopupsAbertos();
                        break;
                    case 37:
                        e.preventDefault();
                        Popup.fecharPopupsAbertos();
                        break;
                    case 38:
                        e.preventDefault();
                        Popup.fecharPopupsAbertos();
                        break;
                    case 39:
                        e.preventDefault();
                        Popup.fecharPopupsAbertos();
                        break;
                }
            }
        });
      }
    },
    abrir : function($botao){
        Popup.inserirMascara($botao[0]);
        
        if(!$botao[0].popupID){
            $botao[0].popupID = Popup.obterNovoID();
            Popup.inserirPopup($botao[0]);
            Popup.aplicarAudio($('#'+$botao[0].popupID));
        }
        
        if(!$('#'+$botao[0].popupID).hasClass('dentro')) Popup.zIndex++;
        
        Popup.posicionar($botao[0]);
        $('#'+$botao[0].popupID).addClass('dentro').removeClass('fora');
        Popup.tocarAudio($('#'+$botao[0].popupID));
        
        Audios.pausarAudioDoEnunciado($botao.closest('.tela'));
    },
    aplicarAudio : function($popup){
        var $audio = $popup.find('audio');
        if($audio.size() > 0){
            $audio = $audio.eq(0);
            $audio.addClass('carregado');//para o caso do oncanplay somar este áudio
            $audio[0].load();
            Audios.aplicarEventosDeAudio($audio[0]);
        }
    },
    aplicarConteudoAoPopup : function(botao){
        if(botao.getAttribute('data-popup-conteudo').charAt(0) == '#'){
            $('#'+botao.popupID+' article:eq(0)').append($(botao.getAttribute('data-popup-conteudo')));
        }else if(botao.getAttribute('data-popup-callback')){
            $('#'+botao.popupID+' article:eq(0)').append(Utilidades.executarCallback(botao.getAttribute('data-popup-callback')));
            //data-popup-callback="objeto|metodo:parametro ou funcao:parametro"
        }
    },
    arrastar : function(e){
        var x, y, cssTransform;

        x = e.clientX - Popup.arrastandoPos.x;
        y = e.clientY - Popup.arrastandoPos.y;
        
        Popup.arrastandoPos.x = e.clientX;
        Popup.arrastandoPos.y = e.clientY;
        
        Popup.arrastando.style.left = (parseFloat(Popup.arrastando.style.left) + x) + 'px';
        Popup.arrastando.style.top = (parseFloat(Popup.arrastando.style.top) + y) + 'px';
    },
    fechar : function($popup){
        var ultimoPopup;
        
        Popup.zIndex--;

        $popup.addClass('fora').removeClass('dentro');
        Popup.pararAudio($popup);
        
        ultimoPopup = $('.popup-mascara').size() > 0 && $('.popup.fora').size() == $('.popup').size();
        
        if(ultimoPopup){
            $('.popup-mascara').addClass('fora').removeClass('dentro');
        }
        
        setTimeout(function(){
            $popup.css('z-index', '-1');
            if(ultimoPopup){
                $('.popup-mascara').remove();
            }
        },550);
        
    },
    fecharPopupsAbertos : function(){
        $('.popup.dentro').each(function(i){
            Popup.fechar($(this));
        });
        Popup.zIndex = 0;
    },
    iniciarArrasto : function(e){
        e.stopPropagation();
        
        if(e.target.className && e.target.className.indexOf('bt-popup-arrastar') != -1){
            e.preventDefault();
            Popup.arrastando = $(e.target).closest('.popup')[0];
            Popup.arrastandoPos.x = e.clientX;
            Popup.arrastandoPos.y = e.clientY;

            $(Popup.arrastando).addClass('movendo');
            
            document.addEventListener('mousemove', Popup.arrastar);
        }
    },
    inserirMascara : function(botao){
        if(botao.getAttribute('data-popup-mascara') != null && $('.popup-mascara').size() == 0){ 
            $('.principal:eq(0)').append('<div class="popup-mascara efeitos-evento dentro entrada-duracao-250 saida-duracao-250 entrada-transparencia saida-transparencia"></div>');
        }
    },
    inserirPopup : function(botao){
        $('.principal:eq(0)').append(Popup.obterTemplatePreenchido(botao));
        Popup.aplicarConteudoAoPopup(botao);
    },
    obterNovoID : function() {
        var str = "", letra, caso;
        for(var x=0; x < 8; x++){
            letra = parseInt(Math.random()*26)+1;
            caso = parseInt(Math.random()*2)+1;
            str += (String.fromCharCode(caso%2 == 0? letra+64 : letra+96));
        }
        return str;
    },
    obterAncora : function(botao){
        var $ancora;
        /*
        ancora pode ser:
        - um seletor (.obj ou #obj)
        - o disparador
        - o pai do disparador
        - o container principal
        */
        if(botao.getAttribute('data-popup-ancora') != null){
            if(botao.getAttribute('data-popup-ancora').match(/(\.|#)/)){
                $ancora = $(botao.getAttribute('data-popup-ancora'));
            }else{
                switch(botao.getAttribute('data-popup-ancora')){
                    case 'self':
                        $ancora = $(botao);
                        break;
                    case 'parent':
                        $ancora = $(botao).parent();
                        break;
                    default:
                        $ancora = $('.principal:eq(0)');
                }
            }
        }else{
            $ancora = $('.principal:eq(0)');
        }
        return $ancora;
    },
    obterTemplatePreenchido : function(botao){
        var tpt, audio;
        
        if(botao.getAttribute('data-popup-audio') != null){
            audio = '<audio><source src="'+botao.getAttribute('data-popup-audio')+'" type="audio/mpeg"></audio>';
        }
        tpt = Popup.template;
        tpt = tpt.replace('%id%',botao.popupID);
        tpt = tpt.replace('%tamanho%',botao.getAttribute('data-popup-tamanho')  != null ? 'tamanho_'+botao.getAttribute('data-popup-tamanho') : '');
        tpt = tpt.replace('%estilos%',botao.getAttribute('data-popup-estilos')  != null ? botao.getAttribute('data-popup-estilos') : 'entrada-duracao-500 saida-duracao-500 entrada-peladireita-elastico saida-porbaixo-elastico');
        //estatico não possui botão de arrasto
        tpt = tpt.replace('%estatico%',botao.getAttribute('data-popup-estatico')  != null ? 'popup-estatico' : '');
        //tpt = tpt.replace('%rolagem%',botao.getAttribute('data-popup-rolagem')  != null ? /*'class="'+botao.getAttribute('data-popup-rolagem')+*/'class="rolagem"' : '');
        
        /*
        o conteudo por ser:
        - string html
        - uma referencia a um elemento html indicado pelo id
        - um conteudo dinamico gerado a partir de um callback
        */
        tpt = tpt.replace('%conteudo%',botao.getAttribute('data-popup-conteudo').charAt(0) != '#' ? botao.getAttribute('data-popup-conteudo') : '');
        tpt = tpt.replace('%audio%',audio ? audio : '');
        
        if(botao.getAttribute('data-popup-titulo') != null){
            tpt = tpt.replace('%tipo%','');
            tpt = tpt.replace('%titulo%','<header>'+botao.getAttribute('data-popup-titulo')+'</header>');
        }else{
            tpt = tpt.replace('%tipo%','popup-mini');
            tpt = tpt.replace('%titulo%','');
        }                
        
        return tpt;
    },
    onAbrir : function(e){
        e.preventDefault();
        e.stopPropagation();
        
        Popup.abrir($(e.currentTarget));
    },
    onFechar : function(e){
        var $popup = $(e.target).closest('.popup');
        Popup.fechar($popup);
    },
    onFecharTodos : function(e){
        Popup.fecharPopupsAbertos();
    },
    pararAudio : function($popup){
        var $audio = $popup.find('audio');
        if($audio.size() > 0){
            $audio = $audio.eq(0);
            Telas.sairAudio($audio);
        }
    },
    pararArrasto : function(e){
        e.stopPropagation();
        
        if(Popup.arrastando){
            e.preventDefault();
            document.removeEventListener('mousemove', Popup.arrastar, false);
            $(Popup.arrastando).removeClass('movendo');
            Popup.arrastando = null;
        }
    },
    posicionar : function(botao){
        var $popup, $ancora, posPopX, posPopY;
        
        $popup = $('#'+botao.popupID);
        
        $ancora = Popup.obterAncora(botao);


        posPopX = (($ancora.outerWidth() - $popup.outerWidth()) / 2) + ($ancora.offset().left - $('.principal:eq(0)').offset().left);
        posPopY = (($ancora.outerHeight() - $popup.outerHeight()) / 2) + ($ancora.offset().top - $('.principal:eq(0)').offset().top);


        $popup.css('top', posPopY/7.5 + 'vh');
        $popup.css('left', posPopX/16 + 'vw');
        $popup.css('z-index', 10000 + Popup.zIndex);
    },
    template : '<div id="%id%" class="popup efeitos-evento %tamanho% %tipo% %estilos% %estatico%">'+
                 '<aside>'+
                   '<button class="bt-ico bt-popup-arrastar">#</button>'+
                   '<button class="bt-ico bt-popup-fechar">-</button>'+
                 '</aside>'+
                 '%titulo%'+
                 '<article>%conteudo%</article>'+
                 '%audio%'+
               '</div>',
    tocarAudio : function($popup){
        if(!/mudo/.test(document.querySelector('.principal').className)){
            var $audio = $popup.find('audio');
            if($audio.size() > 0){
                $audio = $audio.eq(0);
                $audio[0].play();
            }
        }
    },
    tocarPausarAudio : function(e){
        if($(e.target).hasClass('empausa')){
            //tocar o audio pausado
            var $audio = $('[data-status="pausado"]', '.popup');
            if($audio.size() > 0){
                $audio.eq(0)[0].play();
            };
        }else{
            //pausar o audio
            var $audio = $('[data-status="tocando"]', '.popup');
            if($audio.size() > 0){
                $audio.eq(0)[0].setAttribute('data-status','pausado');
                $audio.eq(0)[0].pause();
            }
        }
    },
};

var ImagemMapeada = {
    entrar : function(elemento){
    },
    sair : function(elemento){
        Popup.fecharPopupsAbertos();
    }
};

var Players = {
    plyrInstancias : null,
    aplicarEventoDePausa : function(){
        $('.bt-tocarpausar').on('click',Players.onPausar);
        $('.bt-box-sair').on('click',Players.onPausar);
        $('.bt-avancar').on('click',Players.onPausar);
        $('.bt-retroceder').on('click',Players.onPausar);
        $('.bt-recarregar').on('click',Players.onPausar);
        $('.bt-tutorial').on('click',Players.onPausar);
    },
    aplicarFullScreen : function(plyr){
        if(!plyr.isFullscreen){
            var $plyr = $(plyr.container);
            var temPai = ($plyr.parent().size() > 0 && $plyr.parent()[0].tagName.toLowerCase() != 'body') ? true : false;
            while(temPai){
                $plyr = $plyr.parent();
                $plyr.addClass('plyr-parent');
                temPai = ($plyr.parent().size() > 0 && $plyr.parent()[0].tagName.toLowerCase() != 'body') ? true : false;
            }
            $('body').addClass('fullscreen');
            plyr.isFullscreen = true;
        }else{
            $('.plyr-parent').removeClass('plyr-parent');
            $('body').removeClass('fullscreen');
            plyr.isFullscreen = false;
        }
    },
    carregar : function(){
        Players.plyrInstancias = plyr.setup(document.querySelectorAll('.plyr-ctn'));
        
        if(document.querySelectorAll('[data-interacoes-tempos]').length > 0){
            for(var instancia in Players.plyrInstancias){
                if(Players.plyrInstancias[instancia].getOriginal().getAttribute('data-interacoes-tempos')){
                    Players.plyrInstancias[instancia].on('ready',function(event){
                        //interval pq carregamento eh assincrono                    
                        var interv = setInterval(function(){
                            if(event.detail.plyr.getDuration() > 0){
                                clearInterval(interv);
                                Players.criarMarcadores(event.detail.plyr);
                            }
                        },100);
                    });
                    Players.plyrInstancias[instancia].on('timeupdate',function(event){
                        var tempoAtual = Math.round(event.detail.plyr.getCurrentTime());
                        var tempos = event.detail.plyr.getOriginal().getAttribute('data-interacoes-tempos').split(',');
                        var idxAtual, id, tipo;
                        
                        tempos = tempos.filter(function(tempo,idx){
                            if(tempo == tempoAtual){
                                idxAtual = idx;
                            }
                            return tempo == tempoAtual
                        });
                        
                        if(tempos.length > 0 && tempos[0] == tempoAtual && !event.detail.plyr.isPaused()){
                            event.detail.plyr.pause();
                            id = event.detail.plyr.getOriginal().getAttribute('data-interacoes-ids').split(',')[idxAtual];
                            tipo = $('#'+id).children(':eq(0)')[0].getAttribute('data-tipo');
                            window[tipo].entrar($('#'+id).children(':eq(0)')[0]);
                            $('#'+id).show().addClass('efeitos');
                            event.detail.plyr.getOriginal().tempoAtual = tempoAtual;
                        }
                    });
                }
            }
            
            $('.bt-fechar-interacao').on('click',function(e){
                var plyr = $(e.target).closest('article').find('.plyr-ctn:eq(0)')[0].plyr;
                plyr.seek(plyr.getOriginal().tempoAtual + 0.6);
                plyr.play();
                VideoInteracao.sair(e.target.parentNode);
            });
            
            $(window).resize(Players.reposicionarMarcadores);
        }
        
        Players.aplicarEventoDePausa();
    },
    onPausar:function(e){
        if(!$(e.target).hasClass('empausa')){
            Players.pausarVideos();
        }
    },
    pausarVideos : function(){
        for(var instancia in Players.plyrInstancias){
            Players.plyrInstancias[instancia].pause();
        }
    },
    criarMarcadores : function(objPlyr){
        var $plyrControls = $(objPlyr.getContainer()).find('.plyr__controls:eq(0)');
        var interacoes = objPlyr.getOriginal().getAttribute('data-interacoes-tempos').split(',');
        for(var interacao in interacoes){
            $plyrControls.append('<span class="plyr-marca"></span>');
        }
        Players.posicionarMarcadores(objPlyr);
    },
    posicionarMarcadores : function(objPlyr){
        var $plyrProgress = $(objPlyr.getContainer()).find('.plyr__progress:eq(0)');
        var $marcas = $(objPlyr.getContainer()).find('.plyr-marca');
        var tempos = objPlyr.getOriginal().getAttribute('data-interacoes-tempos').split(',');
        
        $marcas.each(function(i){
            //dist: acrescentando margin e padding left no calculo
            var dist = $plyrProgress.position().left + parseInt($plyrProgress.css('margin-left')) + parseInt($(objPlyr.getContainer()).css('padding-left'));
            $(this).css('left',((($plyrProgress.width() * tempos[i])/objPlyr.getDuration()) + dist) + 'px');
        });
    },
    reposicionarMarcadores : function(){
        var tmpPlyr;
        for(var instancia in document.querySelectorAll('[data-interacoes-tempos]')){
            tmpPlyr = document.querySelectorAll('[data-interacoes-tempos]')[instancia];
            if(tmpPlyr.plyr){
                Players.posicionarMarcadores(tmpPlyr.plyr);
            }
        }
    }
};

/*var Video = {
    entrar : function(elemento){},
    sair : function(elemento){}
}*/

var VideoInteracao = {
    entrar : function(elemento){},
    sair : function(elemento){
        var tipo = $(elemento).children(':eq(0)')[0].getAttribute('data-tipo');
        var $audioEnunciado = $(elemento).children('.audioEnunciado');
        if($audioEnunciado.size() > 0){
            Telas.sairAudio($audioEnunciado.children('audio'));
        }
        window[tipo].sair($(elemento).children(':eq(0)')[0]);
        $(elemento).removeClass('efeitos').hide();
    }
};