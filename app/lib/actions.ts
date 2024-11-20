'use server';
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { error } from "console";

const formSchema= z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
});

const CreateInvoice= formSchema.omit({id: true, date: true});

export default async function createInvoice(formdata: FormData) {
    const rawFormData= {
        customerId: formdata.get('customerId'),
        amount: formdata.get('amount'),
        status: formdata.get('status'),
    };
    const {customerId, amount, status}= CreateInvoice.parse(rawFormData);
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
            message: "Database error: failed to create invoice."
        };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice= formSchema.omit({id: true, date: true});

export async function updateInvoice(id: string, formdata: FormData) {
    const {customerId, amount, status}= UpdateInvoice.parse({
        customerId: formdata.get('customerId'),
        amount: formdata.get('amount'),
        status: formdata.get('status')
    });

    const amountInCents= amount * 100;

    try {
        await sql `
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    } catch (error) {
        return {
            message: "Database error: failed to update the invoice"
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
            message: "Database error: failed to delete the invoice"
        };
    }
}