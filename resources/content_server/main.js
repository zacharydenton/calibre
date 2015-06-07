(function() {
    'use strict';

    var $window = $(window);

    /* Based on https://github.com/tuupola/jquery_lazyload */
    $.belowthefold = function(element) {
        var fold = (window.innerHeight ? window.innerHeight : $window.height()) + $window.scrollTop();
        return fold <= $(element).offset().top;
    };

    $.rightoffold = function(element) {
        var fold = $window.width() + $window.scrollLeft();
        return fold <= $(element).offset().left;
    };

    $.abovethetop = function(element) {
        var fold = $window.scrollTop();
        return fold >= $(element).offset().top + $(element).height();
    };

    $.leftofbegin = function(element) {
        var fold = $window.scrollLeft();
        return fold >= $(element).offset().left + $(element).width();
    };

    $.inviewport = function(element) {
         return !$.rightoffold(element) && !$.leftofbegin(element) &&
                !$.belowthefold(element) && !$.abovethetop(element);
    };

    var Book = Backbone.Model.extend({
      idAttribute: 'application_id'
    });

    var Books = Backbone.Collection.extend({
        model: Book,
        url: '/ajax/books',

        parse: function(response) {
            return _.values(response);
        }
    });

    var BookView = Backbone.View.extend({
        template: _.template($('#book-template').html()),
        tagName: 'div',
        className: 'book grid-item',

        events: {
            'click': 'onClick',
            'appear': 'onAppear'
        },

        render: function() {
            var html = this.template(this.model.toJSON());
            this.$el.html(html);
            return this;
        },

        setBackgroundImage: function() {
            this.$el.css('background-image', 'url(/get/cover/' + this.model.id + ')');
        },

        onClick: function() {
            Backbone.trigger('selectBook', this.model);
        },

        onAppear: function() {
            this.setBackgroundImage();
        }
    });

    var BookListView = Backbone.View.extend({
        el: '.book-list',

        initialize: function() {
            this.listenTo(this.collection, 'sync', this.render);
        },

        render: function() {
            this.collection.each(function(model) {
                var item = new BookView({model: model});
                this.$el.append(item.render().$el);
            }, this);

            return this;
        }
    });

    var BookDetailView = Backbone.View.extend({
        el: '.book-detail',
        template: _.template($('#book-detail-template').html()),

        setModel: function(model) {
            this.model = model;
            this.render();
            return this;
        },

        render: function() {
            var html = this.template(this.model.toJSON());
            this.$el.html(html);
            return this;
        }
    });

    var AppView = Backbone.View.extend({
        el: 'body',

        initialize: function() {
            this.$appbar = this.$('.app-bar');
            this.$navdrawer = this.$('.navdrawer-container');
            this.$search = this.$('input[type="search"]');
            this.setupSearch();
        },

        events: {
            'click main': 'closeMenu',
            'click .menu': 'toggleMenu',
            'click .search': 'activateSearch',
            'click .navdrawer-container a': 'closeMenu',
            'click .navdrawer-container li': 'closeMenu'
        },

        setupSearch: function() {
            var query = location.search.substring(1);
            if (query.indexOf("query") == 0) {
                var searchQuery = query.split("=")[1].replace(/\+/g, " ");
                this.$search.val(searchQuery);
            }
        },

        toggleMenu: function() {
            this.$el.toggleClass('open');
            this.$appbar.toggleClass('open');
            this.$navdrawer.toggleClass('open');
            this.$navdrawer.addClass('opened');
        },

        closeMenu: function() {
            this.$el.removeClass('open');
            this.$appbar.removeClass('open');
            this.$navdrawer.removeClass('open');
        },

        activateSearch: function() {
            this.$search.val('').focus();
        }
    });

    function lazyImages() {
        $('.grid-item:not([style])').each(function() {
            if ($.inviewport(this)) {
                $(this).trigger('appear');
            }
        });
    }

    function App() {
        var appView = new AppView();
        var books = new Books();
        var bookListView = new BookListView({collection: books});
        var bookDetailView = new BookDetailView();

        Backbone.on('selectBook', function(model) {
            bookDetailView.setModel(model);
        });

        this.start = function() {
            books.reset(calibre_books);
            bookListView.render();
            bookDetailView.setModel(books.first());

            $window.resize(_.debounce(lazyImages));
            $window.scroll(_.throttle(lazyImages));
            lazyImages();
        };

    }

    $(function() {
        window.app = new App();
        app.start();
    });
})();
