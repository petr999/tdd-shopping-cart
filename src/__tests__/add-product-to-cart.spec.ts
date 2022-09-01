import { Cart } from "../cart/domain/cart";
import { Product } from "../cart/domain/product";
import { FakeProductRepository } from "../cart/infra/fake-product.repository";
import {
  AddProductCartRequest,
  addProductToCart,
} from "../cart/usecases/add-product-to-cart.usecase";
import { selectCart } from "../cart/usecases/cart.slice";
import { AppStore } from "../store";
import { cartBuilder } from "./builders/cart.builder";
import { productBuilder } from "./builders/product.builder";
import { storeBuilder as buildStore } from "./builders/store.builder";

describe("Feature: Adding a product to the cart", () => {
  let sut: Sut;

  beforeEach(() => {
    sut = createSut();
  });
  describe("Rule: Should add a quantity of one product when adding a product", () => {
    test('Example: Adding "mustard" at 2.5€ in the cart', async () => {
      sut.givenExistingProduct(
        productBuilder().ofId("mustard").priced(2.5).build()
      );
      sut.givenCart(cartBuilder().empty().build());

      await sut.whenAddingProductInCart({
        productId: "mustard",
      });

      sut.thenCartShouldBe(
        cartBuilder()
          .withProducts([
            {
              productId: "mustard",
              quantity: 1,
              price: 2.5,
            },
          ])
          .withTotal(2.5)
          .build()
      );
    });

    test('Example: Adding a "ketchup" at 2€ in the cart already containing one "mustard" at 2.5€', async () => {
      sut.givenExistingProduct(
        productBuilder().ofId("mustard").priced(2.5).build()
      );
      sut.givenExistingProduct(
        productBuilder().ofId("ketchup").priced(2).build()
      );
      sut.givenCart(
        cartBuilder()
          .withProducts([
            {
              productId: "mustard",
              quantity: 1,
              price: 2.5,
            },
          ])
          .withTotal(2.5)
          .build()
      );

      await sut.whenAddingProductInCart({
        productId: "ketchup",
      });

      sut.thenCartShouldBe(
        cartBuilder()
          .withProducts([
            {
              productId: "mustard",
              quantity: 1,
              price: 2.5,
            },
            {
              productId: "ketchup",
              quantity: 1,
              price: 2,
            },
          ])
          .withTotal(4.5)
          .build()
      );
    });

    test('Example: Adding a second "ketchup" at 2€ in the cart already containing one "mustard" at 2.5€ and one "ketchup" at 2€', async () => {
      sut.givenExistingProduct(
        productBuilder().ofId("mustard").priced(2.5).build()
      );
      sut.givenExistingProduct(
        productBuilder().ofId("ketchup").priced(2).build()
      );
      sut.givenCart(
        cartBuilder()
          .withProducts([
            {
              productId: "mustard",
              quantity: 1,
              price: 2.5,
            },
            {
              productId: "ketchup",
              quantity: 1,
              price: 2,
            },
          ])
          .withTotal(4.5)
          .build()
      );

      await sut.whenAddingProductInCart({
        productId: "ketchup",
      });

      sut.thenCartShouldBe(
        cartBuilder()
          .withProducts([
            {
              productId: "mustard",
              quantity: 1,
              price: 2.5,
            },
            {
              productId: "ketchup",
              quantity: 2,
              price: 2,
            },
          ])
          .withTotal(6.5)
          .build()
      );
    });
  });
});

const createSut = () => {
  const productRepository = new FakeProductRepository();
  let storeBuilder = buildStore().withProductRepository(productRepository);
  let store: AppStore;
  return {
    givenCart(cart: Cart) {
      storeBuilder = storeBuilder.withCart(cart);
    },
    givenExistingProduct(product: Product) {
      productRepository.givenExistingProduct(product);
    },
    async whenAddingProductInCart(
      addProductInCartRequest: AddProductCartRequest
    ) {
      store = storeBuilder.build();
      await store.dispatch(addProductToCart(addProductInCartRequest));
    },
    thenCartShouldBe(expectedCart: Cart) {
      const cart = selectCart(store.getState());
      expect(cart).toEqual(expectedCart);
    },
  };
};

type Sut = ReturnType<typeof createSut>;
