import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigate, Link as RemixLink } from "@remix-run/react";
import { json } from "@remix-run/node";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  Text,
  InlineStack,
  TextField,
  Select,
  Box,
  InlineError,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

interface ActionData {
  product?: any;
  variants?: any;
  error?: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};



const CREATE_PRODUCT_MUTATION = `
  mutation createProduct($product: ProductCreateInput!) {
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
              sku
              price
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// We will update the variant's price using productVariantsBulkUpdate
const UPDATE_VARIANT_MUTATION = `
  mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        price
        barcode
        createdAt
        sku
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const status = formData.get("status") as string;
  // We can still collect `sku` from the form if needed in the future,
  // but productVariantsBulkUpdate won't let us update it. We'll ignore it for now.
  const sku1 = formData.get("sku") as string;

  // Create the product
  const createResponse = await admin.graphql(CREATE_PRODUCT_MUTATION, {
    variables: {
      product: {
        title,
        status, // 'ACTIVE' or 'DRAFT'
      },
    },
  });

  const createJson: any = await createResponse.json();
  if (createJson.errors) {
    console.error("GraphQL errors (createProduct):", createJson.errors);
    return json<ActionData>({ error: "Failed to create product." }, { status: 500 });
  }

  if (createJson.data.productCreate.userErrors?.length) {
    console.error("User errors (createProduct):", createJson.data.productCreate.userErrors);
    return json<ActionData>({ error: "Failed to create product." }, { status: 400 });
  }

  const product = createJson.data.productCreate.product;
  if (!product) {
    return json<ActionData>({ error: "No product returned from productCreate." }, { status: 500 });
  }

  const variantId = product.variants.edges[0]?.node?.id;
  if (!variantId) {
    return json<ActionData>({ product, error: "Product created but no variant found." }, { status: 500 });
  }

  // Since productVariantsBulkUpdate cannot update sku, let's update the price as an example.
  // This will set the variant's price to "100.00".
  const updateResponse = await admin.graphql(UPDATE_VARIANT_MUTATION, {
    variables: {
      productId: product.id,
      variants: [
        {
          
          id: variantId,
          inventoryItem: {
            sku: sku1
          }
        },
      ],
    },
  });

  const updateJson: any = await updateResponse.json();
  if (updateJson.errors) {
    console.error("GraphQL errors (updateVariant):", updateJson.errors);
    return json<ActionData>({ product, error: "Failed to update variant." }, { status: 500 });
  }

  // Access userErrors from productVariantsBulkUpdate
  if (updateJson.data.productVariantsBulkUpdate.userErrors?.length) {
    console.error("User errors (updateVariant):", updateJson.data.productVariantsBulkUpdate.userErrors);
    return json<ActionData>({ product, error: "Failed to update variant." }, { status: 400 });
  }

  // productVariantsBulkUpdate returns an array of updated variants
  const updatedVariants = updateJson.data.productVariantsBulkUpdate.productVariants;

  return json<ActionData>({ product, variants: updatedVariants });
};

export default function CreateProductPage() {
  const actionData = useActionData<ActionData>();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"ACTIVE"|"DRAFT">("ACTIVE");
  const [sku, setSku] = useState("");

  useEffect(() => {
    if (actionData?.product && !actionData.error) {
      shopify.toast.show("Product created successfully!");
    }
  }, [actionData, shopify]);

  return (
    <Page>
      <TitleBar title="Create a New Product" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingMd">
                  Enter Product Details(it will show a json of the product created)
                </Text>
                {actionData?.error && (
                  <InlineError message={actionData.error} fieldID="title" />
                )}
                <Form method="post">
                  <BlockStack gap="200">
                    <TextField
                      label="Title"
                      value={title}
                      onChange={(value) => setTitle(value)}
                      name="title"
                      autoComplete="off"
                      requiredIndicator
                    />
                    <Select
                      label="Status"
                      options={[
                        { label: "Active", value: "ACTIVE" },
                        { label: "Draft", value: "DRAFT" },
                      ]}
                      onChange={(value) => setStatus(value as "ACTIVE"|"DRAFT")}
                      value={status}
                      name="status"
                    />
                    <TextField
                      label="SKU"
                      value={sku}
                      onChange={(value) => setSku(value)}
                      name="sku"
                      autoComplete="off"
                    />
                    <InlineStack gap="300">
                      <RemixLink to="/">
                       <Button url="/app/testmainscreen">
                        Back to Home
                       </Button>
                      </RemixLink>
                      <Button submit variant="primary">
                        Create Product
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Form>
                {actionData?.product && (
                  <>
                    <Text as="h3" variant="headingMd">
                      Created Product Data
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
                        <code>{JSON.stringify(actionData.product, null, 2)}</code>
                      </pre>
                    </Box>

                    {actionData?.variants && (
                      <>
                        <Text as="h3" variant="headingMd">
                          Updated Variant Data
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
                            <code>{JSON.stringify(actionData.variants, null, 2)}</code>
                          </pre>
                        </Box>
                      </>
                    )}
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
