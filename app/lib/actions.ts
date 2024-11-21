'use server';
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { error } from "console";
// import { error } from "console";

export type State= {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string|null;
};

const formSchema= z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: "Please select a customer."
    }),
    amount: z.coerce.number().gt(0, {message: "Please enter an amount grater than $0"}),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: "Please select an invoice status."
    }),
    date: z.string()
});

const CreateInvoice= formSchema.omit({id: true, date: true});

export default async function createInvoice(prevState: State, formdata: FormData) {
    const rawFormData= {
        customerId: formdata.get('customerId'),
        amount: formdata.get('amount'),
        status: formdata.get('status'),
    };
    const validatedFields= CreateInvoice.safeParse(rawFormData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing fields, failed to create invoice."
        }
    }

    const {customerId, amount, status}= validatedFields.data;

    const amountInCents= amount * 100;
    const date= new Date().toISOString().split('T')[0];
    // console.log(rawFormData);

    try {
        await sql `
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error) {
        return {
            message: "Database error: failed to create invoice.",
            error: error
        };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice= formSchema.omit({id: true, date: true});

export async function updateInvoice(id: string, prevState: State, formdata: FormData) {
    const validatedFields= UpdateInvoice.safeParse({
        customerId: formdata.get('customerId'),
        amount: formdata.get('amount'),
        status: formdata.get('status')
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Some required fields are empty. Failed to update invoice.'
        };
    }

    const {customerId, amount, status}= validatedFields.data;

    const amountInCents= amount * 100;

    try {
        await sql `
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    } catch (error) {
        return {
            message: "Database error: failed to update the invoice",
            error: error
        };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    // throw new Error('Can\'t touch this.');
    try {
        await sql `DELETE FROM invoices WHERE id= ${id}`;
        revalidatePath("/dashboard/invoices");
        return {
            message: "Invoice deleted successfully"
        };
    } catch (error) {
        return {
            message: "Database error: failed to delete the invoice",
            error: error
        };
    }
}