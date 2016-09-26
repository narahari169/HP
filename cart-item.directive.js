'use strict';

angular.module('cart-ui')
  .directive('cartItem', function() {
    return {
      scope: {
        item: '=',
        onRemove: '&',
        onUpdate: '&',
        onEdit: '&'
      },
      require: '^errorMessages',
      restrict: 'E',
      templateUrl: 'templates/cart-ui/cart-item.html',
      bindToController: true,
      controllerAs: 'vm',
      controller: 'cartItemController',
      link: function($scope, elem, attrs, ctrl) {
        // problems looking up errorMessage controller on same scope...
        $scope.vm.errorMessages = ctrl.get($scope);
      }
    };
  })
  .controller('cartItemController', function($scope, $timeout, dynamicForms, $window) {
    var vm = this;

    vm.isOrderable = vm.item.summary.state !== 'RETIRED';

    // only configure items that we can order!
    vm.isConfigurable = ((vm.item.form && vm.item.form.fields.length) || vm.item.serviceInstance)
      && vm.isOrderable
    vm.isQuantityUnsupported = vm.item.quantityUnsupported;

    if (!vm.isOrderable) {
      // vm.itemForm is late bound by the view
      $timeout(function() {
        vm.itemForm.$setValidity('retired', false);
      });
    } else if (vm.item.denied) {
      $timeout(function() {
        vm.itemForm.$setValidity('denied', false);
      });
    } else if (vm.item.reorder && !vm.item.form.$valid) {
      // check form validation
      dynamicForms.evalForm(vm.item);
      if (vm.item.form.$invalid) {
        // vm.itemForm is late bound by the view
        $timeout(function() {
          vm.itemForm.$setValidity('configuration', false);
        });
      }
    }

    // TODO: hack - watch for invalidity, should move to error-messages
    $scope.$watch(function() {
      return vm.itemForm && vm.itemForm.$invalid;
    }, function(invalid) {
      if (invalid) {
        if (vm.itemForm.$error.retired) {
          vm.errorMessages.setError('retired');
        } else if (vm.itemForm.$error.configuration) {
          vm.errorMessages.setError('configuration');
        } else if(vm.itemForm.$error.denied) {
          vm.errorMessages.setError('denied');
        }
      } else {
        vm.errorMessages.unsetError();
      }
    });

    vm.remove = function() {
      vm.onRemove();
    };

    vm.update = function() {
      vm.onUpdate()
        // flag nested form controller to be pristine
        .then(function() {
          vm.itemForm.$setPristine();
          vm.item.quantity = Number(vm.item.quantity);
        });
          
        //$window.location.reload();
        //$state.reload();
    };

    vm.edit = function() {
      vm.onEdit();
    };

    vm.ignoreApproval = function() {
      vm.item.denied = false;
      vm.itemForm.$setValidity('denied', true);
    };
  });
