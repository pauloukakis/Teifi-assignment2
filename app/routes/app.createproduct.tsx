import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  FormLayout,
  TextField,
  ButtonGroup, 
  Button,
  Divider
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import React from "react";



export default function CardDefault() {
  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h1" variant="headingSm">
          Create a Product
        </Text>
        <Divider />
        <FormLayout>
          <TextField
            label="Product ID"
            onChange={() => {}}
            autoComplete="off"
          />
          <TextField
            label="Product Status"
            onChange={() => {}}
            autoComplete="off"
          />
          <TextField
            label="Product Variant"
            onChange={() => {}}
            autoComplete="off"
          />
        </FormLayout>
        <Divider borderColor="border" />
        <ButtonGroup>
          <Button>Cancel</Button>
          <Button variant="primary">Create</Button>
        </ButtonGroup>
      </BlockStack>
    </Card>
  );
}


