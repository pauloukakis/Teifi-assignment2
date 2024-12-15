import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, Link as RemixLink, useNavigate, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  InlineStack,
  ResourceList,
  ResourceItem,
  Link as PolarisLink,
  Pagination
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

interface ProductVariant {
  id: string;
  sku?: string;
}

interface Product {
  id: string;
  title: string;
  status: string;
  variant?: ProductVariant;
}

interface LoaderData {
  products: Product[];
}

const GET_ALL_PRODUCTS_QUERY = `
  query getAllProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          status
          variants(first:1) {
            edges {
              node {
                id
                sku
              }
            }
          }
        }
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  // Fetch a large number of products at once (maximum allowed by Shopify is currently 250)
  const variables = { first: 250 };
  
  const response = await admin.graphql(GET_ALL_PRODUCTS_QUERY, { variables });
  const data: any = await response.json();
  if (data.errors) {
    console.error("GraphQL errors:", data.errors);
    throw new Response("Failed to fetch products", { status: 500 });
  }

  const edges = data.data.products.edges || [];
  const products: Product[] = edges.map((edge: any) => ({
    id: edge.node.id,
    title: edge.node.title,
    status: edge.node.status,
    variant: edge.node.variants?.edges?.[0]?.node
      ? { id: edge.node.variants.edges[0].node.id, sku: edge.node.variants.edges[0].node.sku }
      : undefined,
  }));

  return json<LoaderData>({ products });
};

const CREATE_PRODUCT_MUTATION = `
  mutation populateProduct($product: ProductCreateInput!) {
    productCreate(product: $product) {
      product {
        id
        title
        handle
        status
        variants(first: 10) {
          edges {
            node {
              id
              price
              barcode
              createdAt
            }
          }
        }
      }
    }
  }
`;

const UPDATE_VARIANTS_MUTATION = `
  mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        price
        barcode
        createdAt
      }
    }
  }
`;

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][Math.floor(Math.random() * 4)];

  // Create a product
  const createResponse = await admin.graphql(CREATE_PRODUCT_MUTATION, {
    variables: {
      product: {
        title: `${color} Snowboard`,
      },
    },
  });

  const createJson: any = await createResponse.json();
  if (createJson.errors) {
    console.error("Create product errors:", createJson.errors);
    throw new Response("Failed to create product", { status: 500 });
  }

  const product = createJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;

  // Update its variant
  const updateResponse = await admin.graphql(UPDATE_VARIANTS_MUTATION, {
    variables: {
      productId: product.id,
      variants: [{ id: variantId, price: "100.00" }],
    },
  });

  const updateJson: any = await updateResponse.json();
  if (updateJson.errors) {
    console.error("Update variant errors:", updateJson.errors);
    throw new Response("Failed to update variant", { status: 500 });
  }

  return {
    product,
    variant: updateJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const { products } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const navigate = useNavigate();

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const isLoading = ["loading", "submitting"].includes(fetcher.state) && fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id?.replace("gid://shopify/Product/", "");

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Page>
      <TitleBar title="Remix app template">
        <button onClick={generateProduct}>Generate a product</button>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Product List 🎉
                </Text>
                <Text variant="bodyMd" as="p">
                  This version fetches all products and displays only 5 at a time. Use the pagination
                  buttons to navigate through the products.
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Current Products
                </Text>
                <ResourceList
                  resourceName={{ singular: "product", plural: "products" }}
                  items={currentProducts}
                  // Use ResourceList's built-in pagination prop
                  pagination={{
                    hasNext: hasNextPage,
                    hasPrevious: hasPreviousPage,
                    onNext: handleNextPage,
                    onPrevious: handlePreviousPage,
                  }}
                  renderItem={(product) => {
                    const { id, title, status, variant } = product;
                    return (
                      <ResourceItem
                        id={id}
                        accessibilityLabel={`View details for ${title}`}
                        url="#"
                      >
                        <Text as="h3" variant="headingMd" fontWeight="semibold">
                          {title}
                        </Text>
                        <div>Status: {status}</div>
                        <div>SKU: {variant?.sku || "N/A"}</div>
                      </ResourceItem>
                    );
                  }}
                />
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Generate a New Product
                </Text>
                <InlineStack gap="300">
                <Button url="/app/testform">
                        Generate a Product
                       </Button>
                  {fetcher.data?.product && (
                    <Button
                      url={`shopify:admin/products/${productId}`}
                      target="_blank"
                      variant="plain"
                    >
                      View product
                    </Button>
                  )}
                </InlineStack>
                {fetcher.data?.product && (
                  <>
                    <Text as="h3" variant="headingMd">
                      productCreate mutation result
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>{JSON.stringify(fetcher.data.product, null, 2)}</code>
                      </pre>
                    </Box>
                    <Text as="h3" variant="headingMd">
                      productVariantsBulkUpdate mutation result
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>{JSON.stringify(fetcher.data.variant, null, 2)}</code>
                      </pre>
                    </Box>
                  </>
                )}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout>
      </BlockStack>
    </Page>
  );
}
