document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("checkoutForm");

    form.addEventListener("submit", function(e){

        e.preventDefault();

        // Honeypot check: if this hidden field got filled in, it's almost certainly a bot.
        const honeypot = document.getElementById("website");
        if (honeypot && honeypot.value) {
            return;
        }

        const cart = getCart();
        if (!cart || cart.length === 0) {
            return; // submit button is disabled when cart is empty, this is just a safety net
        }

        // Build a readable multi-line order summary out of every cart line,
        // since the existing EmailJS template has one "product" field.
        const orderLines = cart.map(line =>
            `${line.qty} x ${line.name} (${line.colour}, ${line.size}) — R${line.price * line.qty}`
        ).join("\n");
        const total = cart.reduce((sum, l) => sum + l.qty * l.price, 0);
        const itemCount = cart.reduce((sum, l) => sum + l.qty, 0);

        const btn = form.querySelector(".submit-btn");
        const originalText = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = "Sending...";

        emailjs.send(
            "service_oft329f",
            "template_pty6vkq",
            {
                full_name: document.getElementById("fullName").value,

                email: document.getElementById("email").value,

                phone: document.getElementById("phone").value,

                product: orderLines,

                size: "",

                colour: "",

                qty: itemCount,

                order_total: "R" + total,

                address: document.getElementById("address").value,

                payment: document.getElementById("fPayment").value,

                details: document.getElementById("details").value,

                time: new Date().toLocaleString()
            }
        )

        .then(function(){

            btn.innerHTML = "✓ Order Sent!";
            btn.style.background = "#2d7a3e";

            form.reset();
            clearCart();
            if (typeof renderOrderSummary === "function") renderOrderSummary();

            setTimeout(function(){

                btn.innerHTML = originalText;
                btn.style.background = "";
                btn.disabled = false;

            },3000);

        })

        .catch(function(error){

            console.error(error);

            btn.innerHTML = "Failed — WhatsApp Us Instead";
            btn.style.background = "#c62828";

            setTimeout(function(){

                btn.innerHTML = originalText;
                btn.style.background = "";
                btn.disabled = false;

            },5000);

        });

    });

});